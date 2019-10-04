const util = require('../util')

module.exports = function (opt) {

  if (!opt.value) throw new Error('Missing value parameter, pass url or html as value parameter')

  const chromeOptions = {}
  chromeOptions.emulateMedia = util.checkBoolean(opt.printMedia) ? "print" : "screen"

  const pdfOptions = {}
  pdfOptions.scale = 1
  pdfOptions.printBackground = true
  opt.waitForReadyToRender = util.checkBoolean(opt.waitForReadyToRender)
  opt.disableCache = util.checkBoolean(opt.disableCache)

  const rpOptions = {}
  //this sets landscape to undefined if not explicitly set as false, if undefined the engine will use report default
  //The array is called if this is sent via a form post request
  rpOptions.landscape = Array.isArray(opt.landscape) ? true : util.checkBoolean(opt.landscape)
  //TODO check format and add console message
  rpOptions.format = opt.format;
  rpOptions.debug = util.checkBoolean(opt.includeConsole)
  rpOptions.startTime = new Date
  rpOptions.readyToRender = false
  rpOptions.consoleMessages = []
  //TODO validate that timeout is number and less than or equal to account's timeout

  return {
    chromeOptions,
    pdfOptions,
    rpOptions,

  }
}