var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function (req, res, next) {
  res.render('convert', {
    title: 'Pdf Converter',
    formats: ['Letter', 'Legal', 'Ledger', 'Tabloid', 'A4', 'A5', 'A6']
  });
});

module.exports = router;
