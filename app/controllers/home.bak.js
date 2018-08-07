const { body, validationResult } = require('express-validator/check');
const { sanitizeBody } = require('express-validator/filter');
const qs = require('qs')
const selectListObjectArray = require("../util/selectListObjectArray")


module.exports = {
  urlConvert: function (req, res, next) {
    const vals = qs.parse(req.query)

    const formData = {
      title: 'Url to Pdf Converter',
      formats: ['Letter', 'Legal', 'Ledger', 'Tabloid', 'A4', 'A5', 'A6']
    }
    if (vals) {
      Object.assign(formData, vals)
    }
    formData.formats = selectListObjectArray(formData.formats, vals['format'] || '')
    res.render('home/convert', formData);
  }

}
