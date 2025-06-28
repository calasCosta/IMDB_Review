const { getCorpus, getTotalRows, getClassCount } = require('../database/corpus.js');
const { preprocessText } = require('./preprocessing.js');
const bag = require('./bagOfWords.js');
const { selectKBest } = require('./featureSelection.js');

async function calculateClassPriorProbability(sentiment) {
    const total = await getTotalRows();
    const classCount = await getClassCount(sentiment);
    const prior = classCount / total;
    console.log(`P(${sentiment}) = ${prior}`);
    return prior;
}

const customStopwords = [
  // super frequentes neutros em ambos
  'movi', 'film', 'like', 'she', 'realli', 'charact', 'seri', 'it', 'know', 'made', 'music',
  'stori', 'funni', 'seen', 'act', 'actor', 'show', 'plot', 'plai', 'think', 'better',
  'goldsworthi', 'littl', 'origin', 'excel', 'make', 'great', 'new', 'world', 'camp',

  // conectivos e palavras de ligação
  'on', 'so', 'just', 'even', 'when', 'will', 'time', 'mom', 'hell', 'old', 'young',

  // stemming colapsado
  'good movi', 'love movi', 'ever seen', 'funni movi', 'movi tri', 'movi hell', 
  'mom like', 'like itgreat', 'itgreat camp', 'jacki chan', 'betti boop', 'karen carpent', 
  'bui copi', 'origin gut', 'gut wrench', 'wrench laughter', 'laughter movi'
];


async function train(classes = ['positive', 'negative'], nValues = [1, 2], limit = 100) {
    const results = {};

    // criticalTerms: sempre incluídos no topK
    const criticalTerms = ['good', 'bad', 'not_good', 'not_bad', 'love', 'dont_love', 'horrible', 'fantastic'];

    for (const className of classes) {
        console.log(`\n🔍 Treinando classe ${className}`);
        const documents = await getCorpus(className, limit);

        const preprocessedDocs = await Promise.all(
            documents.map(async doc => {
                const reviewText = typeof doc.Review === 'string' ? doc.Review : '';
                const processed = await preprocessText(reviewText, nValues, customStopwords);
                return { id: doc.id, sentiment: doc.sentiment, processed };
            })
        );

        let unigramsBag = [];
        let bigramsBag = [];
        const allUnigramDocs = [];
        const allBigramDocs = [];

        preprocessedDocs.forEach(doc => {
            const unigramTokens = doc.processed?.tokens?.[0]?.tokens || [];
            const bigramTokens = doc.processed?.tokens?.[1]?.tokens || [];

            if (unigramTokens.length > 0) {
                bag.addUniqueTerms(unigramsBag, unigramTokens);
                allUnigramDocs.push(unigramTokens);
            }
            if (bigramTokens.length > 0) {
                bag.addUniqueTerms(bigramsBag, bigramTokens);
                allBigramDocs.push(bigramTokens);
            }
        });

        console.log(`Classe ${className} → Unigrams: ${unigramsBag.length}, Bigrams: ${bigramsBag.length}`);

        const idfUnigrams = bag.idfVector(unigramsBag, allUnigramDocs);
        const idfBigrams = bag.idfVector(bigramsBag, allBigramDocs);

        const documentsWithVectors = preprocessedDocs.map(doc => {
            const unigramTokens = doc.processed?.tokens?.[0]?.tokens || [];
            const bigramTokens = doc.processed?.tokens?.[1]?.tokens || [];

            const tfUnigram = bag.tfVector(unigramsBag, unigramTokens);
            const tfidfUnigram = bag.normalizeTfidfVector(
                bag.tfidfVector(tfUnigram, idfUnigrams)
            );

            const tfBigram = bag.tfVector(bigramsBag, bigramTokens);
            const tfidfBigram = bag.normalizeTfidfVector(
                bag.tfidfVector(tfBigram, idfBigrams)
            );

            return {
                ...doc,
                vectors: {
                    unigrams: { tf: tfUnigram, tfidf: tfidfUnigram },
                    bigrams: { tf: tfBigram, tfidf: tfidfBigram }
                }
            };
        });

        const topKPerN = {};
        const kFactor = 0.5;

        for (const n of nValues) {
            const tfidfTerms = documentsWithVectors.flatMap(doc => {
                const tfidfList = doc.vectors[n === 1 ? 'unigrams' : 'bigrams']?.tfidf;
                return Array.isArray(tfidfList)
                    ? tfidfList.filter(t => typeof t.tfidf === 'number' && !isNaN(t.tfidf))
                    : [];
            });

            const vocabLength = n === 1 ? unigramsBag.length : bigramsBag.length;
            const K = Math.max(20, Math.round(vocabLength * kFactor));

            let topK = selectKBest(tfidfTerms, K, 'tfidf', 'sum') || [];

            // 🔥 Adiciona criticalTerms manualmente se não estão no topK
            criticalTerms.forEach(term => {
                if (!topK.some(t => t.name === term)) {
                    topK.push({
                        name: term,
                        tfidf: 0.01,
                        binary: 1,
                        occurrences: 1,
                        tf: 0.01,
                        idf: 1
                    });
                }
            });

            topKPerN[n] = topK;

            console.log(`Classe ${className} n=${n} → topK=${K} termos + críticos`);
            console.table(topK.slice(0, 20).map(t => ({ name: t.name, tfidf: t.tfidf.toFixed(4) })));
        }

        const prior = await calculateClassPriorProbability(className);

        results[className] = {
            documents: documentsWithVectors,
            vocabPerN: { 1: unigramsBag, 2: bigramsBag },
            idfPerN: { 1: idfUnigrams, 2: idfBigrams },
            topKPerN,
            priorProbability: prior
        };
    }

    return results;
}

module.exports = {
    train,
    calculateClassPriorProbability
};
