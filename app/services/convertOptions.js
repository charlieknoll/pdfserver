const util = require('../util')

module.exports = function (opt) {
  //TODO don't allow for too long a timeout
  const chromeOptions = {}
  chromeOptions.emulateMedia = opt.printMedia ? "print" : "screen"
  chromeOptions.imageDelay = opt.imageDelay ? opt.imageDelay : (opt.disableCache ? 1000 : 200)

  const pdfOptions = {}
  pdfOptions.scale = 1
  pdfOptions.printBackground = true
  opt.waitForReadyToRender = util.checkBoolean(opt.waitForReadyToRender)
  opt.disableCache = util.checkBoolean(opt.disableCache)

  const rpOptions = {}
  //this sets landscape to undefined if not explicitly set as false, if undefined the engine will use report default
  //The array is called if this is sent via a form post request
  rpOptions.landscape = Array.isArray(opt.landscape) ? true : opt.landscape === 'false' ? false : opt.landscape
  rpOptions.format = opt.format;
  rpOptions.debug = opt.includeConsole === "on";
  rpOptions.startTime = new Date
  rpOptions.readyToRender = false
  rpOptions.consoleMessages = []
  rpOptions.timeout = opt.timeout ? opt.timeout : 30000
  rpOptions.addConsoleMessage = function (mgs) {
    this.consoleMessages.push(util.getTimeStamp(this.startTime) + ": ")
  }
  rpOptions.msRemaining = function () {
    //leave a 100ms buffer so that proper timeout message is thrown
    return this.timeout - (new Date - this.startTime) - 100
  }
  return {
    chromeOptions,
    pdfOptions,
    rpOptions,

  }
}