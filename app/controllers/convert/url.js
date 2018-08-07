const auth = require('../../middlewares/authorization')
const { validationResult, body } = require('express-validator/check');
const { sanitizeBody } = require('express-validator/filter');
const { db, sendEmail, logger } = require('../../services')
const { arrayToSelectList } = require('../../util')
const qs = require('qs')

const url = '/convert/url'
const viewPath = url.substring(1)

const actionVm = function (req, errors) {
  var errMsgs = [].map(e => e.msg)

  const vals = qs.parse(req.query)

  const formData = {
    title: 'Url to Pdf Converter',
    formats: ['Letter', 'Legal', 'Ledger', 'Tabloid', 'A4', 'A5', 'A6']
  }
  if (vals) {
    Object.assign(formData, vals)
  }
  formData.formats = arrayToSelectList(formData.formats, vals['format'] || '')
  formData.errors = (errors || []).map(e => e.msg)
  return formData
}
const get = function (req, res, next) {
  const errors = []
  if (req.session.errorMessage) {
    errors.push({ msg: req.session.errorMessage })
    delete req.session.errorMessage;
  }
  res.render(viewPath, actionVm(req, errors));
}

module.exports = function (app) {
  app.get(url, auth.requiresUser, get)
  //app.post(url, validate, handleValidationErrors, post)
}