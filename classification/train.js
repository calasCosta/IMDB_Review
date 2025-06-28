const { getCorpus, getTotalRows, getClassCount} = require('../database/corpus.js');
const { preprocessText } = require('./preprocessing.js');
const bag = require('./bagOfWords.js');
const { selectKBest } = require('./featureSelection.js');

// Calcula a P(ω) da classe (probabilidade a priori)
async function calculateClassPriorProbability(sentiment) {
    const total = await getTotalRows();
    const classCount = await getClassCount(sentiment);
    const prior = classCount / total;
    console.log(`P(${sentiment}) = ${prior}`);
    return prior;
}

async function train(classes = ['positive', 'negative'], nValues = [1, 2], limit = 10) {
    const results = {};

    for (const className of classes) {
        console.log(`\n🔍 Treinando classe ${className}`);
        const documents = await getCorpus(className, limit);

        const preprocessedDocs = await Promise.all(
            documents.map(async doc => {
                const reviewText = typeof doc.Review === 'string' ? doc.Review : '';
                const processed = await preprocessText(reviewText, nValues);
                return {
                    id: doc.id,
                    sentiment: doc.sentiment,
                    processed
                };
            })
        );

        // Inicializa vocabulários
        let unigramsBag = [];
        let bigramsBag = [];

        const allUnigramDocs = [];
        const allBigramDocs = [];

        // Atualiza vocabulários e armazena tokens por doc
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

        console.log(`Classe ${className} → Unigrams únicos: ${unigramsBag.length}, Bigrams únicos: ${bigramsBag.length}`);

        // Calcula IDF
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

        // SelectKBest
        const topKPerN = {};
        const kFactor = 0.2;

        for (const n of nValues) {
            const tfidfTerms = documentsWithVectors.flatMap(doc => {
                const tfidfList = doc.vectors[n === 1 ? 'unigrams' : 'bigrams']?.tfidf;
                return Array.isArray(tfidfList)
                    ? tfidfList.filter(t => typeof t.tfidf === 'number' && !isNaN(t.tfidf))
                    : [];
            });

            const vocabLength = n === 1 ? unigramsBag.length : bigramsBag.length;
            const K = Math.max(10, Math.round(vocabLength * kFactor));

            const topK = selectKBest(tfidfTerms, K, 'tfidf', 'sum') || [];
            topKPerN[n] = topK;

            console.log(`Classe ${className} n=${n} → tfidfTerms válidos: ${tfidfTerms.length}`);
            console.log(`Top ${K} termos para n=${n}:`);
            console.table(topK.slice(0, 5).map(t => ({ name: t.name, tfidf: t.tfidf.toFixed(4) })));
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
