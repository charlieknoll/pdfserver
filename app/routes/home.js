var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function (req, res, next) {
  res.render('home/index', { title: 'Home' });
});
router.get('/convert', function (req, res, next) {
  res.render('home/convert', { title: 'Url to Pdf Converter' });
});
router.get('/playground', function (req, res, next) {
  res.render('home/playground', { title: 'Html to Pdf Converter' });
});

module.exports = router;
