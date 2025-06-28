const { train } = require('./classification/train');
const { probabilisticClassification } = require('./classification/classifier'); // ou classification.js
const { cosineSimilarity } = require('./classification/classifier');

const readline = require('readline');
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

(async () => {
  console.log('\n🔄 A treinar o classificador...');
  const trainedData = await train(['positive', 'negative'], [1, 2], 100); // aumenta se quiseres

  rl.question('\n✏️ Escreve o texto a classificar:\n> ', async (inputText) => {
    console.log('\n📊 Resultados com Naive Bayes:');
    const bayes = await probabilisticClassification(inputText, trainedData, [1, 2]);
    console.log(bayes);

    console.log('\n📐 Resultados com Cosine Similarity:');
    const cosine = await cosineSimilarity(inputText, trainedData, [1, 2]);
    console.log(cosine);

    rl.close();
  });
})();
