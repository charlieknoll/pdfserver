const express = require('express')
const router = express.Router()
const { requiresApiKey } = require('../../../middlewares/authorization')
const asyncHandler = require('express-async-handler')
const generatePdf = require('../../../services/generatePdf')

const sendPdf = function (req, res, { filename, content }) {
  res.set('Content-Type', 'application/pdf')
  let fileName = req.body.fileName || result.pageTitle
  fileName = replaceAll(fileName, ' ', '-')
  fileName += ".pdf";
  throw new Error('test')
  res.set('Content-Disposition', 'inline; filename=' + fileName)
  if (result.content) {
    res.send(result.content)
  }
  else {
    res.end()
  }

}
const get = async function (req, res, next) {
  sendPdf(req, res, await generatePdf(req.query))
}
const post = async function (req, res, next) {
  sendPdf(req, res, await generatePdf(req.body))
}
const errorHandler = function (err, req, res, next) {
  //TODO how to get error?
  data = {
    error: err.message,
    consoleLogs: err.consoleLogs
  }
  JSON.stringify(data)
  res.set('Content-Type', 'application/problem+json')
  res.send(JSON.stringify(data))
}


router.use(asyncHandler(requiresApiKey))

router.get('/', asyncHandler(get), errorHandler)
router.post('/', asyncHandler(post))

router.use(errorHandler)

module.exports = router