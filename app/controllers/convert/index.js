const auth = require('../../middlewares/authorization')
const { validationResult, body } = require('express-validator/check')
const { sanitizeBody } = require('express-validator/filter')
const { db, sendEmail, logger, browserPool } = require('../../services')

const { arrayToSelectList } = require('../../util')
const qs = require('qs')
const asyncHandler = require('express-async-handler')
const generatePdf = require('../pdf')
const { replaceAll } = require('../../util')

const url = '/convert'
const viewPath = url.substring(1) + '/convert'

const actionVm = function (req, errors) {
  var errMsgs = [].map(e => e.msg)

  const vals = qs.parse(req.query)

  const formData = {
    title: 'Pdf Converter',
    formats: ['', 'Letter', 'Legal', 'Ledger', 'Tabloid', 'A4', 'A5', 'A6'],
    apikey: req.user.apikey
  }
  if (vals) {
    Object.assign(formData, vals)
  }
  formData.formats = arrayToSelectList(formData.formats, vals['format'] || '')
  formData.errors = (errors || []).map(e => e.msg)
  //TODO look up user's developer apiKey

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
const post = async function (req, res, next) {
  const pageContext = await browserPool().acquire();
  try {

    res.set('Content-Type', 'application/pdf')
    const result = await generatePdf(res, pageContext.page, req.body);
    let fileName = req.body.fileName || result.pageTitle
    fileName = replaceAll(fileName, ' ', '-')
    fileName += ".pdf";
    // res.writeHead(200, {
    //   'Content-Type': 'application/pdf',
    //   'Content-Disposition': 'inline; filename=' + fileName,
    //   'Content-Length': result.content.length,
    //   'Accept-Ranges': 'bytes',
    //   'Vary': 'Accept-Encoding'
    // });
    if (result.content) {
      res.send(result.content)
    }
    else {
      res.end()
    }
    //res.download()
  }
  finally {
    //TODO Instead of destroy, call release and delete cookies, navigate back, verify "Hi" is content of page, if not destroy
    //TODO maybe only do that in production so that in debug mode cache is invalidated every request?
    await browserPool().destroy(pageContext)
  }
}

module.exports = function (app) {
  app.get(url, auth.requiresUser, get)
  app.post(url, asyncHandler(auth.requiresApiKey), asyncHandler(post))
}