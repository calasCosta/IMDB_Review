const {  cosineSimilarity, probabilisticClassification} = require('./classifier.js');
const { train } = require('./train.js');     

async function test(){
    const trainedData = await train(['positive', 'negative']);
    
    // const review = [
    // "I love this product!",
    // "I don't love this product!",
    // "This is not good.",
    // "This is good.",
    // "Horrible movie.",
    // "Fantastic film!"
    // ]
    // for (const text of review) {
    //     const result = await cosineSimilarity(text, trained);
    //     console.log(`\n[COSINE] "${text}"`);
    //     console.log(`Predicted class: ${result.predictedClass}`);
    //     console.log(`Similarities:`, result.similarities);
    // }

//     await cosineSimilarity("This is good", trainedData, [1,2]);
// await probabilisticClassification("This is good", trainedData, [1,2]);
}

test().catch(console.error);

module.exports = {
    test
};