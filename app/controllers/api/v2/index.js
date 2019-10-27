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
const get = async function (req, res, next) {
  let logsSaved = false
  try {
    if (req.rp.include_console) req.query.includeConsole = true

    const result = await generatePdf(req.query)
    if (!result) throw new Error('Error creating pdf')
    await logs.save(result, req)
    logsSaved = true
    sendPdf(req, res, result)
  } catch (e) {
    if (!logsSaved && e.requestLog) logs.save(e, req)
    next(e)
  }
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

router.get('/', asyncHandler(concurrentLimiter), asyncHandler(rateLimiter), asyncHandler(get), errorHandler)
router.post('/', asyncHandler(concurrentLimiter), asyncHandler(rateLimiter), asyncHandler(post), errorHandler)

router.use(errorHandler)

module.exports = router