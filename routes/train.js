var express = require('express');
var router = express.Router();
const { train } = require('../classification/train.js');
const { cosineSimilarity, probabilisticClassification } = require('../classification/classifier.js');

const {
    createConfusionMatrix,
    calculateMetrics,
    printConfusionMatrix
} = require('../classification/stats.js');
const { route } = require('./index.js');

const { getCorpus, getNegativeReviewOriginalSet, getPositiveReviewOriginalSet } = require('../database/corpus');

// Variável para armazenar o modelo treinado
let trainedData = null;

// Treinamento inicial
const globalLimit = 100; 

/* GET home page. */
router.get('/train', async function(req, res, next) {

    // Treinar primeiro:
    // Treinar apenas uma vez se ainda não estiver treinado
    if (!trainedData){
        trainedData = await train(['positive', 'negative'], [1, 2], globalLimit);
    }

    //------------------------- stats test ---------------------
    // const trueLabels = ['positive', 'negative', 'positive', 'positive', 'negative'];
    // const predicted = ['positive', 'positive', 'positive', 'negative', 'negative'];

    // const matrix = createConfusionMatrix(trueLabels, predicted);
    // printConfusionMatrix(matrix);

    // const metrics = calculateMetrics(matrix);
    // console.log("\nMetrics:", metrics);

    // ----------------- end stats test ----------------------

    //console.log(result);
    res.json(trainedData);
    //res.render('index', { title: 'IMDB Review'});
});


// GET /classify - mostra o formulário
router.get('/classify', (req, res) => {
  res.render('classify', {
    result: null,
    text: '',
    model: 'cosine'
  });
});

// POST /classify - processa o texto e devolve a classificação
router.post('/classify', async (req, res) => {
  const { text, model } = req.body;
  const selectedModel = model === 'bayes' ? 'bayes' : 'cosine'; // fallback para cosine

  try {
    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return res.render('classify', {
        result: null,
        text,
        model: selectedModel,
        error: 'Texto inválido. Por favor insira uma crítica para classificar.'
      });
    }

    // Treinar apenas uma vez
    if (!trainedData) {
      trainedData = await train(['positive', 'negative'], [1, 2], globalLimit); // Podes ajustar o tamanho
    }

    let result;
    if (selectedModel === 'cosine') {
      result = await cosineSimilarity(text, trainedData, [1, 2]);
    } else {
      result = await probabilisticClassification(text, trainedData, [1, 2]);
    }

    res.render('classify', {
      text,
      model: selectedModel,
      result
    });

  } catch (error) {
    console.error('Erro ao classificar o texto:', error);
    res.render('error', {
      message: 'Ocorreu um erro ao classificar o texto.',
      error
    });
  }
});

router.get('/stats', async (req, res) => {
  try {
    // 1. Obter textos reais da BD
    const positiveReviews = await getPositiveReviewOriginalSet(globalLimit);
    const negativeReviews = await getNegativeReviewOriginalSet(globalLimit);

    const testSet = [
      ...positiveReviews.map(r => ({ text: r.Review, sentiment: 'positive' })),
      ...negativeReviews.map(r => ({ text: r.Review, sentiment: 'negative' }))
    ];

    // 2. Treinar o modelo se necessário
    if (!trainedData) {
      trainedData = await train(['positive', 'negative'], [1, 2], globalLimit);
    }

    const trueLabels = [];
    const predictedLabels = [];

    // 3. Classificar os textos
    for (const item of testSet) {
      const result = await probabilisticClassification(item.text, trainedData, [1, 2]);
      trueLabels.push(item.sentiment);
      predictedLabels.push(result.predictedClass);
    }

    // 4. Calcular métricas
    const matrix = createConfusionMatrix(trueLabels, predictedLabels);
    const metrics = calculateMetrics(matrix);

    // 5. Enviar para a view
    res.render('stats', {
      trueLabels,
      predictedLabels,
      matrix,
      metrics
    });

  } catch (error) {
    console.error('Erro em /stats:', error);
    res.render('error', {
      message: 'Erro ao gerar estatísticas.',
      error
    });
  }
});

module.exports = router;