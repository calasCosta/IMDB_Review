const { getCorpus, getTotalRows, getClassCount } = require('../database/corpus.js');
const { preprocessText } = require('./preprocessing.js');
const bag = require('./bagOfWords.js');
const { selectKBest } = require('./featureSelection.js');

const customStopwords = [
    'movi', 'film', 'see', 'watch', 'on', 'wait', 'no', 'go', 'thing', 'director', 
    'she', 'realli', 'charact', 'seri', 'it', 'know', 'made', 'music',
    'stori', 'funni', 'seen', 'act', 'actor', 'show', 'plot', 'plai', 'think', 'better',
    'goldsworthi', 'littl', 'origin', 'excel', 'make', 'new', 'world', 'camp',
    'so', 'just', 'even', 'when', 'will', 'time', 'mom', 'hell', 'old', 'young',
    'gut', 'wrench', 'feel', 'laugh', 'laugher', 'ever', 'tri', 'itgreat',
    'ever seen', 'funni movi', 'movi tri', 'movi hell', 
    'mom like', 'like itgreat', 'itgreat camp', 'jacki chan', 'betti boop', 'karen carpent', 
    'bui copi', 'origin gut', 'gut wrench', 'wrench laughter', 'laughter movi'
];

const criticalTerms = ['good', 'bad', 'not_good', 'not_bad', 'love', 'dont_love', 'horrible', 'fantastic'];

async function calculateClassPriorProbability(sentiment) {
    const total = await getTotalRows();
    const classCount = await getClassCount(sentiment);
    const prior = classCount / total;
    console.log(`P(${sentiment}) = ${prior}`);
    return prior;
}

async function train(classes = ['positive', 'negative'], nValues = [1, 2], limit = 50) {
    const results = {};

    for (const className of classes) {
        console.log(`\n🔍 Trainning class ${className}`);
        const documents = await getCorpus(className, limit);

        const preprocessedDocs = await Promise.all(
            documents.map(async doc => {
                const text = typeof doc.Review === 'string' ? doc.Review : '';
                const processed = await preprocessText(text, nValues, customStopwords);
                return { id: doc.id, sentiment: doc.sentiment, processed };
            })
        );

        const bagData = {
            unigramsBag: [], bigramsBag: [],
            allUnigramDocs: [], allBigramDocs: []
        };

        preprocessedDocs.forEach(doc => {
            const unigrams = doc.processed.tokens?.[0]?.tokens || [];
            const bigrams = doc.processed.tokens?.[1]?.tokens || [];
            if (unigrams.length) {
                bag.addUniqueTerms(bagData.unigramsBag, unigrams);
                bagData.allUnigramDocs.push(unigrams);
            }
            if (bigrams.length) {
                bag.addUniqueTerms(bagData.bigramsBag, bigrams);
                bagData.allBigramDocs.push(bigrams);
            }
        });

        console.log(`Classe ${className} → Unigrams: ${bagData.unigramsBag.length}, Bigrams: ${bagData.bigramsBag.length}`);

        // IDF
        const idfPerN = {
            1: bag.idfVector(bagData.unigramsBag, bagData.allUnigramDocs),
            2: bag.idfVector(bagData.bigramsBag, bagData.allBigramDocs)
        };

        // Compute tfidf vectors
        const documentsWithVectors = preprocessedDocs.map(doc => {
            const unigrams = doc.processed.tokens?.[0]?.tokens || [];
            const bigrams = doc.processed.tokens?.[1]?.tokens || [];

            const tfUnigrams = bag.tfVector(bagData.unigramsBag, unigrams);
            const tfidfUnigrams = bag.normalizeTfidfVector(bag.tfidfVector(tfUnigrams, idfPerN[1]));

            const tfBigrams = bag.tfVector(bagData.bigramsBag, bigrams);
            const tfidfBigrams = bag.normalizeTfidfVector(bag.tfidfVector(tfBigrams, idfPerN[2]));

            return {
                ...doc,
                vectors: {
                    unigrams: { tf: tfUnigrams, tfidf: tfidfUnigrams },
                    bigrams: { tf: tfBigrams, tfidf: tfidfBigrams }
                }
            };
        });

        const topKPerN = {};
        const kFactor = 0.5;

        for (const n of nValues) {
            const tfidfTerms = documentsWithVectors.flatMap(doc =>
                doc.vectors[n === 1 ? 'unigrams' : 'bigrams']?.tfidf || []
            ).filter(t => typeof t.tfidf === 'number' && !isNaN(t.tfidf));

            const vocabLength = n === 1 ? bagData.unigramsBag.length : bagData.bigramsBag.length;
            const K = Math.max(50, Math.round(vocabLength * kFactor));

            let topK = selectKBest(tfidfTerms, K, 'tfidf', 'sum') || [];

            // 🧹 Remove stopwords at the final stage (single or multi-word)
            const stopwordSet = new Set(customStopwords);
            topK = topK.filter(term => {
                const parts = term.name.split(' ');
                return !parts.some(p => stopwordSet.has(p));
            });

            // Ensure critical terms are included
            criticalTerms.forEach(term => {
                if (!topK.some(t => t.name === term)) {
                    topK.push({ name: term, tfidf: 0.01, binary: 1, occurrences: 1, tf: 0.01, idf: 1 });
                }
            });

            topKPerN[n] = topK;

            console.log(`Classe ${className} n=${n} → topK=${K} termos + críticos`);
            console.table(topK.slice(0, 10).map(t => ({ name: t.name, tfidf: t.tfidf.toFixed(4) })));
        }

        const prior = await calculateClassPriorProbability(className);

        results[className] = {
            documents: documentsWithVectors,
            vocabPerN: { 1: bagData.unigramsBag, 2: bagData.bigramsBag },
            idfPerN,
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
