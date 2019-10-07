const auth = require('../../middlewares/authorization')
const { arrayToSelectList } = require('../../util')
const qs = require('qs')
const asyncHandler = require('express-async-handler')
const generatePdf = require('../../services/generatePdf')
const { replaceAll } = require('../../util')
const rpContent = require('../../services/rpContent')

const url = '/convert'
const viewPath = url.substring(1) + '/convert'

const actionVm = function (req, errors) {
  var errMsgs = [].map(e => e.msg)

  const vals = qs.parse(req.query)

  const formData = {
    title: 'Pdf Converter',
    formats: rpContent.formats,
    versions: rpContent.versions,
    apikey: req.user.apikey
  }
  if (vals) {
    Object.assign(formData, vals)
  }
  formData.formats = arrayToSelectList(formData.formats, vals['format'] || '', true)
  formData.versions = arrayToSelectList(formData.versions, vals['version'] || '', true)
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

  try {
    const result = await generatePdf(req.body);
    res.set('Content-Type', 'application/pdf')
    let fileName = req.body.fileName || result.pageTitle
    fileName = replaceAll(fileName, ' ', '-')
    if (fileName == '') {
      if (req.body.value && req.body.value.substring(0, 4).toLowerCase() === 'http') {
        var matches = req.body.value.match(/:\/\/(?:www\.)?(.[^/]+)(.*)/);
        fileName = matches[matches.length - 1]
        fileName = replaceAll(fileName, '/', '')
      }
      if (fileName == '') {
        fileName = 'converted'
      }
    }
    fileName += ".pdf";
    res.set('Content-Disposition', 'inline; filename=' + fileName)
    if (result.content) {
      res.send(result.content)
    }
    else {
      res.end()
    }
  }
  catch (e) {
    next(e)

  }

}

module.exports = function (app) {
  app.get(url, auth.requiresUser, get)
  app.post(url, asyncHandler(auth.requiresApiKey), asyncHandler(post))
}