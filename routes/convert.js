var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('convert', { title: 'Pdf Converter' });
});

module.exports = router;
