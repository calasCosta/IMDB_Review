var express = require('express');
var router = express.Router();
var getConnection = require('../database/config').getConnection;
const {getPositiveReviewOriginalSet, getNegativeReviewOriginalSet} = require('../database/corpus.js');
const { train } = require('../classification/train.js');
const { cosineSimilarity, probabilisticClassification } = require('../classification/classifier.js');

const {
    createConfusionMatrix,
    calculateMetrics,
    printConfusionMatrix
} = require('../classification/stats.js');


//const { test } = require('../classification/test-train.js');

// Variável para armazenar o modelo treinado
let trainedData = null;

// Treinamento inicial
var globalLimit = 50; 

router.get('/', async function(req, res, next) {
  var positiveReviews = await getPositiveReviewOriginalSet(globalLimit);
  var negativeReviews = await getNegativeReviewOriginalSet(globalLimit);

  //test();
  getConnection()
    .then(connection => {
      console.log('Database connection successful!');
      connection.end();
    })
    .catch(err => {
      console.error('Database connection failed:', err);
    });

  res.render('index', 
    { title: 'IMDB Review',
      positiveReviews: positiveReviews,
      negativeReviews: negativeReviews
    });
});


/* GET home page. */
router.get('/train', async function(req, res, next) {

    // Treinar primeiro:
    // Treinar apenas uma vez se ainda não estiver treinado
    if (!trainedData){
        trainedData = await train(['positive', 'negative'], [1, 2], globalLimit);
    }

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
    const limit = parseInt(req.query.limit) || globalLimit;

    console.log('Limit for stats:', limit);
    // 1. Obter textos reais da BD
    const positiveReviews = await getPositiveReviewOriginalSet(limit);
    const negativeReviews = await getNegativeReviewOriginalSet(limit);

    const testSet = [
      ...positiveReviews.map(r => ({ text: r.Review, sentiment: 'positive' })),
      ...negativeReviews.map(r => ({ text: r.Review, sentiment: 'negative' }))
    ];

    // 2. Treinar o modelo se necessário
    if (!trainedData) {
      trainedData = await train(['positive', 'negative'], [1, 2], limit);
    }

    const trueLabels = [];
    const predictedLabels = [];

    // 3. Classificar os textos
    for (const item of testSet) {
      // const result = await probabilisticClassification(item.text, trainedData, [1, 2]);
      const result = await cosineSimilarity(item.text, trainedData, [1, 2]);
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
      metrics,
      limit,
      trainedData
    });

  } catch (error) {
    console.error('Error on /stats:', error);
    res.render('error', {
      message: 'Error occurred while processing statistics.',
      error
    });
  }
});

router.post('/stats', async (req, res) => {
    // 1️ Obter limite do query string ou default para 100
    const limit = parseInt(req.body.limit) || 0;
    globalLimit = limit; // Limitar a 1000 para evitar sobrecarga

    res.redirect(`/stats?limit=${limit}`);
});

module.exports = router;

