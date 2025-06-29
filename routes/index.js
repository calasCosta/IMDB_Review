var express = require('express');
var router = express.Router();
var getConnection = require('../database/config').getConnection;
const {getPositiveReviewOriginalSet, getNegativeReviewOriginalSet} = require('../database/corpus.js');

//const { test } = require('../classification/test-train.js');

/* GET home page. */
router.get('/', async function(req, res, next) {
  var positiveReviews = await getPositiveReviewOriginalSet(100);
  var negativeReviews = await getNegativeReviewOriginalSet(100);

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

module.exports = router;
