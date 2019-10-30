const express = require('express')
const router = express.Router()
const { requiresApiKey } = require('../../../middlewares/authorization')
const asyncHandler = require('express-async-handler')
const generatePdf = require('../../../services/generatePdf')
const { rateLimiter, concurrentLimiter } = require('../../../services/rateLimiter')
const { replaceAll } = require('../../../util')
const logs = require('../../../models/logs')


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
const handler = async function (req, res, next) {
  let logsSaved = false
  try {
    const params = Object.assign({}, req.body, req.query)
    if (req.rp.include_console) params.includeConsole = true

    const result = await generatePdf(params)
    if (!result) throw new Error('Error creating pdf')
    await logs.save(result, req)
    logsSaved = true
    sendPdf(req, res, result)
  } catch (e) {
    if (!logsSaved && e.requestLog) logs.save(e, req)
    next(e)
  }
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

router.get('/', asyncHandler(concurrentLimiter), asyncHandler(rateLimiter), asyncHandler(handler), errorHandler)
router.post('/', asyncHandler(concurrentLimiter), asyncHandler(rateLimiter), asyncHandler(handler), errorHandler)

router.use(errorHandler)

module.exports = router