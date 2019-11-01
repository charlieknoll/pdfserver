const express = require('express')
const router = express.Router()
const { requiresApiKey } = require('../../../middlewares/authorization')
const asyncHandler = require('express-async-handler')
const generatePdf = require('../../../services/generatePdf')
const { rateLimiter, concurrentLimiter } = require('../../../services/rateLimiter')
const { replaceAll } = require('../../../util')
const logs = require('../../../models/logs')
const logger = require('../../../services/logger')


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
  const params = Object.assign({}, req.body, req.query)
  if (req.rp.include_console) params.includeConsole = true

  const result = await generatePdf(params)
  if (!result) throw new Error('Error creating pdf')
  await logs.save(result, req)
  req.logsSaved = true
  sendPdf(req, res, result)

}

const errorHandler = async function (err, req, res, next) {
  //TODO how to get error?
  const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  if (!req.logsSaved) {
    if (!err.requestLog) {
      err.requestLog = {
        request_time: new Date,
        delay: 0,
        network_data: 0,
        cached_data: 0,
        from_cache_data: 0,
        file_size: 0,
        duration: function () {
          return (new Date - this.request_time)
        }
      }
      err.cacheLogs = []
      err.status = 500
    }
    await logs.save(err, req)
  }

  if (err.status == 404) {
    logger.warn(`404 - ${err.message} - ${req.originalUrl} - ${req.method} - ${ip}`);

  } else {
    logger.error(`${err.status || 500} - ${err.message} - ${req.originalUrl} - ${req.method} - ${ip}`);

  }
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

router.get('/', asyncHandler(concurrentLimiter), asyncHandler(rateLimiter), asyncHandler(handler), asyncHandler(errorHandler))
router.post('/', asyncHandler(concurrentLimiter), asyncHandler(rateLimiter), asyncHandler(handler), asyncHandler(errorHandler))

router.use(errorHandler)

module.exports = router