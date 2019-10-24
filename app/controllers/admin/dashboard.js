const asyncHandler = require('express-async-handler')
//const { promisify } = require('util')
const config = require('../../config')
var sf = require('slice-file');
//const sliceReverseAsync = promisify(sf.sliceReverse)
const { streamToString } = require('../../util')
const logger = require('../../services/logger')


module.exports = function (router) {

  const get = async function (req, res, next) {
    //throw new Error("test")
    const xs = sf(config.logFile)
    let logs
    // try {
    //   logs = await streamToString(xs.sliceReverse(-100))
    //   //this throws invalid JSON error
    //   //const logs = JSON.parse(logStr.trim())
    // } finally {
    //   xs.close()

    // }
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
