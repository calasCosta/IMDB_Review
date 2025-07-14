// var express = require('express');
// var router = express.Router();
// var getConnection = require('../database/config').getConnection;
// const {getPositiveReviewOriginalSet, getNegativeReviewOriginalSet} = require('../database/corpus.js');
// const { train } = require('../classification/train.js');
// const { cosineSimilarity, probabilisticClassification } = require('../classification/classifier.js');

// const {
//     createConfusionMatrix,
//     calculateMetrics,
//     printConfusionMatrix
// } = require('../classification/stats.js');


// //const { test } = require('../classification/test-train.js');

// // Variável para armazenar o modelo treinado
// let trainedData = null;

// // Treinamento inicial
// var globalLimit = 100; 

// router.get('/', async (req, res) => {
//   var positiveReviews = await getPositiveReviewOriginalSet(globalLimit);
//   var negativeReviews = await getNegativeReviewOriginalSet(globalLimit);

//   //test();
//   getConnection()
//     .then(connection => {
//       console.log('Database connection successful!');
//       connection.end();
//     })
//     .catch(err => {
//       console.error('Database connection failed:', err);
//     });

//   res.render('index', 
//     { title: 'IMDB Review',
//       positiveReviews: positiveReviews,
//       negativeReviews: negativeReviews
//     });
// });


// router.get('/training', async (req, res) => {

//     // Treinar primeiro:
//     // Treinar apenas uma vez se ainda não estiver treinado
//     if (!trainedData){
//         trainedData = await train(['positive', 'negative'], [1, 2], globalLimit);
//     }

//     //console.log(result);
//     //res.json(trainedData);
//     res.render('training', { 
//       trainedData
//     });
// });


// // GET /classify - mostra o formulário
// router.get('/classify', (req, res) => {
//   res.render('classify', {
//     result: null,
//     text: '',
//     model: 'cosine'
//   });
// });

// // POST /classify - processa o texto e devolve a classificação
// router.post('/classify', async (req, res) => {
//   const { text, model } = req.body;
//   const selectedModel = model === 'bayes' ? 'bayes' : 'cosine'; // fallback para cosine

//   try {
//     if (!text || typeof text !== 'string' || text.trim().length === 0) {
//       return res.render('classify', {
//         result: null,
//         text,
//         model: selectedModel,
//         error: 'Texto inválido. Por favor insira uma crítica para classificar.'
//       });
//     }

//     // Treinar apenas uma vez
//     if (!trainedData) {
//       trainedData = await train(['positive', 'negative'], [1, 2], globalLimit); // Podes ajustar o tamanho
//     }

//     let result;
//     if (selectedModel === 'cosine') {
//       result = await cosineSimilarity(text, trainedData, [1, 2]);
//     } else {
//       result = await probabilisticClassification(text, trainedData, [1, 2]);
//     }

//     res.render('classify', {
//       text,
//       model: selectedModel,
//       result
//     });

//   } catch (error) {
//     console.error('Erro ao classificar o texto:', error);
//     res.render('error', {
//       message: 'Ocorreu um erro ao classificar o texto.',
//       error
//     });
//   }
// });

// router.get('/stats', async (req, res) => {
//   try {
//     const limit = parseInt(req.query.limit) || globalLimit;

//     console.log('Limit for stats:', limit);
//     // 1. Obter textos reais da BD
//     const positiveReviews = await getPositiveReviewOriginalSet(limit);
//     const negativeReviews = await getNegativeReviewOriginalSet(limit);

//     const testSet = [
//       ...positiveReviews.map(r => ({ text: r.Review, sentiment: 'positive' })),
//       ...negativeReviews.map(r => ({ text: r.Review, sentiment: 'negative' }))
//     ];

//     // 2. Treinar o modelo se necessário
//     console.log("asdfsadf: "+ !trainedData);
//     //if (!trainedData) {
//       console.log("------------::::: " + limit);
//       trainedData = await train(['positive', 'negative'], [1, 2], limit);
//     //}

//     const trueLabels = [];
//     const predictedLabels = [];

//     // 3. Classificar os textos
//     for (const item of testSet) {
//       // const result = await probabilisticClassification(item.text, trainedData, [1, 2]);
//       const result = await cosineSimilarity(item.text, trainedData, [1, 2]);
//       trueLabels.push(item.sentiment);
//       predictedLabels.push(result.predictedClass);
//     }

//     // 4. Calcular métricas
//     const matrix = createConfusionMatrix(trueLabels, predictedLabels);
//     const metrics = calculateMetrics(matrix);

//     // 5. Enviar para a view
//     res.render('stats', {
//       trueLabels,
//       predictedLabels,
//       matrix,
//       metrics,
//       limit,
//       trainedData
//     });

//   } catch (error) {
//     console.error('Error on /stats:', error);
//     res.render('error', {
//       message: 'Error occurred while processing statistics.',
//       error
//     });
//   }
// });

// router.post('/stats', async (req, res) => {
//     // 1️ Obter limite do query string ou default para 100
//     const limit = parseInt(req.body.limit) || 0;
//     globalLimit = limit; // Limitar a 1000 para evitar sobrecarga

//     res.redirect(`/stats?limit=${limit}`);
// });

// module.exports = router;

var express = require('express');
var router = express.Router();
var getConnection = require('../database/config').getConnection;
const { getPositiveReviewOriginalSet, getNegativeReviewOriginalSet } = require('../database/corpus.js');
const { train } = require('../classification/train.js');
const { cosineSimilarity, probabilisticClassification } = require('../classification/classifier.js');

const { createConfusionMatrix, calculateMetrics } = require('../classification/stats.js');

const { saveTrainedModel, loadLatestTrainedModel } = require('../database/trainedModels.js'); // novo módulo~

const nspell = require('nspell');
const dictionary = require('dictionary-en');

let trainedData = null;
var globalLimit = 200;


function getSpellChecker() {
  return new Promise((resolve, reject) => {
    dictionary((err, dict) => {
      if (err) return reject(err);
      const spell = nspell(dict);
      resolve(spell);
    });
  });
}

async function checkWords(text) {
  const spell = await getSpellChecker();
  const words = text.split(/\s+/);
  const incorrect = [];
  for (const word of words) {
    if (!spell.correct(word)) {
      incorrect.push({ word, suggestions: spell.suggest(word) });
    }
  }
  return incorrect;
}






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

  // Exemplo:
  checkWords("Thiss is a smple txt with erors.").then(result => {
    console.log(result);
    // [{ word: 'Thiss', suggestions: [...] }, { word: 'smple', suggestions: [...] }, ...]
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
    trainedData = await loadLatestTrainedModel('bayes_ngram');
    if (!trainedData) {
      // Treinar e salvar se não existir
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

    if (!trainedData) {
      trainedData = await loadLatestTrainedModel('bayes_ngram');
      if (!trainedData) {
        trainedData = await train(['positive', 'negative'], [1, 2], globalLimit);
        await saveTrainedModel('bayes_ngram', trainedData);
      }
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
    console.log('Limit for stats:', limit);

    const positiveReviews = await getPositiveReviewOriginalSet(limit);
    const negativeReviews = await getNegativeReviewOriginalSet(limit);

    const testSet = [
      ...positiveReviews.map(r => ({ text: r.Review, sentiment: 'positive' })),
      ...negativeReviews.map(r => ({ text: r.Review, sentiment: 'negative' }))
    ];

    const trueLabels = [];
    const predictedLabels = [];

    if (!trainedData) {
      trainedData = await loadLatestTrainedModel('bayes_ngram');
      if (!trainedData) {
        trainedData = await train(['positive', 'negative'], [1, 2], limit);
        await saveTrainedModel('bayes_ngram', trainedData);
      }
    }

    for (const item of testSet) {
      const result = await cosineSimilarity(item.text, trainedData, [1, 2]);
      trueLabels.push(item.sentiment);
      predictedLabels.push(result.predictedClass);
    }

    const matrix = createConfusionMatrix(trueLabels, predictedLabels);
    const metrics = calculateMetrics(matrix);

    res.render('stats', {
      trueLabels,
      predictedLabels,
      matrix,
      metrics,
      limit,
      trainedData
    });

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
