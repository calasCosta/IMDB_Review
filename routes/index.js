var express = require('express');
var router = express.Router();
var getConnection = require('../database/config').getConnection;
const { getPositiveReviewOriginalSet, getNegativeReviewOriginalSet } = require('../database/corpus.js');
const { train } = require('../classification/train.js');
const { cosineSimilarity, probabilisticClassification } = require('../classification/classifier.js');

const { createConfusionMatrix, calculateMetrics } = require('../classification/stats.js');
const { saveTrainedModel, loadLatestTrainedModel } = require('../database/trainedModels.js'); // novo módulo

var globalLimit = 200;

// Simple cache for stats results
const statsCache = {};

// GET / — index
router.get('/', async (req, res) => {
  var positiveReviews = await getPositiveReviewOriginalSet(globalLimit);
  var negativeReviews = await getNegativeReviewOriginalSet(globalLimit);

  getConnection()
    .then(connection => { 
      console.log('Database connection successful!');
      connection.end();
    })
    .catch(err => {
      console.error('Database connection failed:', err);
    });

  res.render('index', {
    title: 'IMDB Review',
    positiveReviews,
    negativeReviews
  });
});


// GET /training — carrega ou treina
router.get('/training', async (req, res) => {
  try {
    // Primeiro tenta carregar modelo salvo
    let trainedData = await loadLatestTrainedModel('bayes_ngram', globalLimit);
    console.log('Modelo carregado:', trainedData);
    if (!trainedData) {
      // Treinar e guardar se não existir
      trainedData = await train(['positive', 'negative'], [1, 2], globalLimit);
      await saveTrainedModel('bayes_ngram', trainedData);
    }
    res.render('training', { trainedData }); 
  } catch (err) {
    console.error('Erro ao carregar/treinar modelo:', err);
    res.render('error', { message: 'Erro ao treinar modelo.', error: err });
  }
});

// GET /classify — mostra form
router.get('/classify', (req, res) => {
  res.render('classify', {
    result: null,
    text: '',
    model: 'cosine'
  });
});

// POST /classify — classifica texto
router.post('/classify', async (req, res) => {
  const { text, model } = req.body;
  const selectedModel = model === 'bayes' ? 'bayes' : 'cosine';

  try {
    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return res.render('classify', {
        result: null,
        text,
        model: selectedModel,
        error: 'Texto inválido. Por favor insira uma crítica para classificar.'
      });
    }

    let trainedData = await loadLatestTrainedModel('bayes_ngram', globalLimit);
    if (!trainedData) {
      trainedData = await train(['positive', 'negative'], [1, 2], globalLimit);
      await saveTrainedModel('bayes_ngram', trainedData);
    }

    let result;
    if (selectedModel === 'cosine') {
      result = await cosineSimilarity(text, trainedData, [1, 2]);
    } else {
      result = await probabilisticClassification(text, trainedData, [1, 2]);
    }

    res.render('classify', { text, model: selectedModel, result });

  } catch (error) {
    console.error('Erro ao classificar:', error);
    res.render('error', { message: 'Erro ao classificar o texto.', error });
  }
});

// GET /stats — avalia classificador
router.get('/stats', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || globalLimit;

    const cacheKey = `${limit}`;
    if (statsCache[cacheKey]) {
      console.log('Serving /stats from cache');
      return res.render('stats', statsCache[cacheKey]);
    }

    const positiveReviews = await getPositiveReviewOriginalSet(limit);
    const negativeReviews = await getNegativeReviewOriginalSet(limit);

    const testSet = [
      ...positiveReviews.map(r => ({ text: r.Review, sentiment: 'positive' })),
      ...negativeReviews.map(r => ({ text: r.Review, sentiment: 'negative' }))
    ];

    const trueLabels = [];
    const predictedLabels = [];

    let trainedData = await loadLatestTrainedModel('bayes_ngram', limit);
    if (!trainedData) {
      trainedData = await train(['positive', 'negative'], [1, 2], limit);
      await saveTrainedModel('bayes_ngram', trainedData, limit );
    }

    for (const item of testSet) {
      const result = await cosineSimilarity(item.text, trainedData, [1, 2]);
      trueLabels.push(item.sentiment);
      predictedLabels.push(result.predictedClass);
    }

    const matrix = createConfusionMatrix(trueLabels, predictedLabels);
    const metrics = calculateMetrics(matrix);

    const statsData = {
      trueLabels,
      predictedLabels,
      matrix,
      metrics,
      limit,
      trainedData
    };

    statsCache[cacheKey] = statsData; // Save to cache

    res.render('stats', statsData);

  } catch (error) {
    console.error('Erro em /stats:', error);
    res.render('error', { message: 'Erro ao calcular estatísticas.', error });
  }
});

// POST /stats — ajusta limite
router.post('/stats', async (req, res) => {
  const limit = parseInt(req.body.limit) || 0;
  globalLimit = limit;
  res.redirect(`/stats?limit=${limit}`);
});

module.exports = router;
