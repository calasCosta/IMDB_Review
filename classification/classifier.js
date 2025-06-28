const { preprocessText } = require('./preprocessing');
const bag = require('./bagOfWords');

function calculateCosineSimilarity(A, B) {
    const dotProduct = A.reduce((sum, a, i) => sum + a * B[i], 0);
    const normA = Math.sqrt(A.reduce((sum, a) => sum + a * a, 0));
    const normB = Math.sqrt(B.reduce((sum, b) => sum + b * b, 0));
    if (normA === 0 || normB === 0) return 0.5;
    return dotProduct / (normA * normB);
}

async function cosineSimilarity(text, trainedData, nValues = [1, 2]) {
    const processed = await preprocessText(text, nValues);
    const similarities = {};
    const criticalPositive = ['love', 'good', 'great', 'fantastic', 'excellent', 'wonderful', 'amazing', 'best', 'like', 'enjoy', 
                                'happy', 'perfect', 'awesome', 'superb', 'fabulous', 'delightful', 'pleased', 'satisfied', 'adore', 'appreciate'];
    const criticalNegative = ['bad', 'worst', 'not_good', 'dont_love', 'horrible', 'bore', 'terribl', 'awful', 'disappointing', 'hate', 
                                'terrible', 'dissatisfied', 'unhappy', 'regret', 'frustrating', 'displeased', 'annoying', 'waste', 'poor', 'mediocre'];

    for (const className in trainedData) {
        let allSimilarities = [];
        let directHits = 0;

        for (const n of nValues) {
            const vocab = trainedData[className].topKPerN[n].map(t => t.name);
            const idfMap = Object.fromEntries(trainedData[className].idfPerN[n].map(t => [t.name, t.idf]));
            const tokensN = processed.tokens.find(t => t.n === n)?.tokens || [];

            const tf = bag.tfVector(vocab.map(term => term.split(' ')), tokensN);
            const tfidf = tf.map(t => t.tf * (idfMap[t.name] || 0));
            const classTfidf = trainedData[className].topKPerN[n].map(t => t.tfidf);

            const cosine = calculateCosineSimilarity(tfidf, classTfidf);
            allSimilarities.push(cosine);

            tokensN.forEach(token => {
                if (vocab.includes(token.join(' '))) directHits++;
            });
        }

        let avgSimilarity = allSimilarities.reduce((sum, s) => sum + s, 0) / allSimilarities.length;
        avgSimilarity += 0.2 * directHits; // boost mais forte

        const flatTokens = processed.preprocessedText.split(' ');
        if (className === 'positive') {
            criticalPositive.forEach(term => {
                if (flatTokens.includes(term)) avgSimilarity += 0.1;
            });
        } else {
            criticalNegative.forEach(term => {
                if (flatTokens.includes(term)) avgSimilarity += 0.1;
            });
        }

        similarities[className] = avgSimilarity;
    }

    // fallback preferindo positive em empate
    const diff = Math.abs(similarities['positive'] - similarities['negative']);
    let predictedClass = similarities['positive'] > similarities['negative'] ? 'positive' : 'negative';
    if (diff < 0.02) {
        console.log(`⚠ Similaridade muito próxima (${diff.toFixed(4)}), default para positive`);
        predictedClass = 'positive';
    }

    console.log(`\n[COSINE] "${text}"`);
    console.log(`Similarities:`, similarities);
    console.log(`→ Predicted class: ${predictedClass}`);

    return { predictedClass, similarities };
}

async function probabilisticClassification(text, trainedData, nValues = [1, 2]) {
    const processed = await preprocessText(text, nValues);
    const scores = {};

    for (const className in trainedData) {
        let logProb = Math.log(trainedData[className].priorProbability);

        for (const n of nValues) {
            const tokensN = processed.tokens.find(t => t.n === n)?.tokens || [];
            const vocab = trainedData[className].topKPerN[n].map(t => t.name);
            const tf = bag.tfVector(vocab.map(term => term.split(' ')), tokensN);

            const sumTfidfClass = trainedData[className].topKPerN[n]
                .reduce((sum, t) => sum + t.tfidf, 0);
            const alpha = Math.max(1.0, sumTfidfClass / (vocab.length || 1));

            vocab.forEach((term, i) => {
                const tfidfTermClass = trainedData[className].topKPerN[n]
                    .find(t => t.name === term)?.tfidf || 0;
                const prob = (tf[i].tf * tfidfTermClass + alpha) / (sumTfidfClass + alpha * vocab.length);
                logProb += Math.log(prob);
            });
        }

        scores[className] = logProb;
    }

    const predictedClass = Object.keys(scores).reduce((a, b) =>
        scores[a] > scores[b] ? a : b
    );

    console.log(`\n[NB] "${text}"`);
    console.log(`Log-scores:`, scores);
    console.log(`→ Predicted class: ${predictedClass}`);

    return { predictedClass, scores };
}

module.exports = {
    cosineSimilarity,
    probabilisticClassification,
    calculateCosineSimilarity
};
