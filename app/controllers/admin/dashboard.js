const asyncHandler = require('express-async-handler')
const config = require('../../config')
const logger = require('../../services/logger')


module.exports = function (router) {

  const get = async function (req, res, next) {
    const xs = sf(config.logFile)
    let logs
    var options = {
      from: new Date - 24 * 60 * 60 * 1000,
      until: new Date,
      limit: 200,
      start: 0,
      order: 'desc',
      fields: ['message', 'level', 'timestamp']
    };
    logger.query(options, function (err, result) {
      if (err) {
        throw err;
      }

      if (result.file) logs = result.file.filter(l => l.level !== 'info')
      res.render(req.baseUrl.substring(1) + '/dashboard', { title: 'Admin Dashboard', logs })

    })
  }

  router.get('/dashboard', asyncHandler(get))

}
