const express = require('express');
const { requiresAdmin, requiresLogin } = require('../middlewares/authorization')
const router = express.Router();
const { body, validationResult } = require('express-validator/check');
const { sanitizeBody } = require('express-validator/filter');
const qs = require('qs')
const selectListObjectArray = require("../util/selectListObjectArray")
/* GET home page. */
router.get('/', function (req, res, next) {
  res.render('home/index', { title: 'Home' });
});
router.get('/convert', requiresLogin, function (req, res, next) {
  const vals = qs.parse(req.query)

  const formData = {
    title: 'Url to Pdf Converter',
    formats: ['Letter', 'Legal', 'Ledger', 'Tabloid', 'A4', 'A5', 'A6'],
    selectedIndex: 0
  }
  if (vals) {
    Object.assign(formData, vals)
  }
  formData.formats = selectListObjectArray(formData.formats, vals['format'] || '')
  res.render('home/convert', formData);
});
router.get('/playground', function (req, res, next) {
  res.render('home/playground', { title: 'Html to Pdf Converter' });
});

module.exports = router;
