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

        const avgSimilarity = allSimilarities.reduce((sum, s) => sum + s, 0) / allSimilarities.length;
        similarities[className] = avgSimilarity + 0.1 * directHits;
    }

    const diff = Math.abs(similarities['positive'] - similarities['negative']);
    let predictedClass = Object.keys(similarities).reduce((a, b) =>
        similarities[a] > similarities[b] ? a : b
    );

    if (diff < 0.02) {
        console.log(`⚠ Similaridade próxima (${diff.toFixed(4)}), usando NB para desempatar`);
        const nbResult = await probabilisticClassification(text, trainedData, nValues);
        predictedClass = nbResult.predictedClass;
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
