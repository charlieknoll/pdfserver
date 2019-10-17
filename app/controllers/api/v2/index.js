const express = require('express')
const router = express.Router()
const { requiresApiKey } = require('../../../middlewares/authorization')
const asyncHandler = require('express-async-handler')
const generatePdf = require('../../../services/generatePdf')
const { replaceAll } = require('../../../util')


const sendPdf = function (req, res, { pageTitle, content, consoleLogs }) {
  try {
    res.set('Content-Type', 'application/pdf')
    let fileName = req.body.fileName || pageTitle
    fileName = replaceAll(fileName, ' ', '-')
    fileName += ".pdf";
    res.set('Content-Disposition', 'inline; filename=' + fileName)
    if (content) {
      res.send(content)
    }
    else {
      res.end()
    }
  }
  catch (e) {
    const error = new Error(e.message)
    error.consoleLogs = consoleLogs
    throw error
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
  res.status(err.consoleLogs && err.consoleLogs.length > 0 ? 500 : 400)
  res.set('Content-Type', 'application/problem+json')
  res.send(JSON.stringify(data))
}


router.use(asyncHandler(requiresApiKey))

router.get('/', asyncHandler(get), errorHandler)
router.post('/', asyncHandler(post), errorHandler)

router.use(errorHandler)

module.exports = router