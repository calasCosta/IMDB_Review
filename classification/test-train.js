const { calculateCosineSimilarity, cosineSimilarity } = require('./classifier.js');
const { train } = require('./train.js');     

async function test(){
    const trained = await train(['positive', 'negative']);
    
    const review = [
 "I love this product!",
 "I don't love this product!",
 "This is not good.",
 "This is good.",
 "Horrible movie.",
 "Fantastic film!"
]
    for (const text of review) {
        const result = await cosineSimilarity(text, trained);
        console.log(`\n[COSINE] "${text}"`);
        console.log(`Predicted class: ${result.predictedClass}`);
        console.log(`Similarities:`, result.similarities);
    }
}

test().catch(console.error);

module.exports = {
    test
};