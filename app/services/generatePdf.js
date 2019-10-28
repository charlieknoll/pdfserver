const rpContent = require('./rpContent')
const util = require('../util')
const convertOptions = require('./convertOptions')
const wirePageEvents = require('./wirePageEvents')
const generatePdfStream = require('./generatePdfStream')
const { db, logger, poolProvider } = require('.')
const minTimeout = 600
const defaultTimeout = 10000


const generatePdf = async (opt) => {

  //For handling mulitple requests to same URI
  //Move inside run?
  const requestCache = {}
  const timeout = util.checkInt(opt.timeout, defaultTimeout, minTimeout)
  const imageTimeout = util.checkInt(opt.imageTimeout, timeout, 0)

  await util.waitFor(() => { return poolProvider.pagePool !== null }, '', timeout, 100)
  const instance = await poolProvider.pagePool.acquire()
  const page = instance.page
  try {
    return await util.runWithTimeout(run, timeout, `pdf generation not completed after ${timeout}ms`)
  }
  finally {
    //TODO Instead of destroy, call release and delete cookies, navigate back, verify "Hi" is content of page, if not destroy
    //TODO maybe only do that in production so that in debug mode cache is invalidated every request?
    await poolProvider.pagePool.destroy(instance)
  }

  async function waitForImages(timeoutInfo) {
    if (Object.keys(requestCache).length === 0) return true
    let imageTimeoutCtr = 0

    if (timeoutInfo.error) return
    let waitTimeout = timeoutInfo.msRemaining() - 500
    if (waitTimeout > imageTimeout) waitTimeout = imageTimeout
    timeoutInfo.addConsoleMessage("Waiting " + waitTimeout + "ms for images to finish loading.")
    const imagesLoaded = await util.waitFor(() => {
      if (timeoutInfo.error) return true
      imageTimeoutCtr += 100
      timeoutInfo.requestLog.delay += 100
      if (imageTimeoutCtr > imageTimeoutCtr) return false
      var images = Object.keys(requestCache).filter(u => requestCache[u].resourceType == 'image' && !requestCache[u].complete)
      return images.length === 0
    }, '', waitTimeout, 100)
    if (imagesLoaded)
      timeoutInfo.addConsoleMessage('Images loaded.')
    else
      timeoutInfo.addConsoleMessage('WARNING: Images not loaded in ' + waitTimeout + 'ms.')
    return imagesLoaded

  }

  async function run(timeoutInfo) {
    timeoutInfo.requestLog = {
      request_time: timeoutInfo.startTime,
      delay: 0,
      network_data: 0,
      cached_data: 0,
      from_cache_data: 0,
      file_size: 0,
      duration: function () {
        return (new Date - this.request_time)
      }
    }
    timeoutInfo.cacheLogs = []
    const { chromeOptions, pdfOptions, rpOptions } = convertOptions(opt)
    timeoutInfo.addConsoleMessage("Processing started")
    await page.setDefaultNavigationTimeout(timeoutInfo.msRemaining())

    await page.setRequestInterception(true);
    wirePageEvents(page, requestCache, opt, timeoutInfo)

    await page.emulateMediaType(chromeOptions.emulateMedia)
    if (opt.value.substring(0, 4).toLowerCase() === 'http') {
      const response = await page.goto(opt.value, { waitUntil: 'load' })
      if (response._status !== 200) {
        const msg = "Chrome could not navigate to page: " + response._status + " - " + response._statusText + " " + opt.value
        timeoutInfo.addConsoleMessage(msg)
        throw new Error(msg)
      }
      timeoutInfo.addConsoleMessage("Page loaded")
    }
    else {
      const response = await page.setContent(opt.value, { waitUntil: 'load' })
    }
    if (timeoutInfo.error) return
    //Do this ASAP after load for best rendering
    await page.addStyleTag({ content: opt.version && rpContent.versions[0] !== opt.version ? await rpContent.rpContentsProvider.css(opt.version) : rpContent.rpStyleContents })

    const msRemaining = timeoutInfo.msRemaining()
    if (opt.waitForReadyToRender) {
      try {
        //If more than 2000ms remain to render then wait for remaining ms less 50% of the msRemaining over 2000 up to 500ms
        const renderTimeout = msRemaining < 2000 ? msRemaining - 10 : msRemaining - Math.min(Math.round(((msRemaining - 2000) * .5)), 500)
        timeoutInfo.addConsoleMessage("WAITING FOR RESPONSIVE_PAPER_READY_TO_RENDER for " + renderTimeout + "ms")
        await page.waitForFunction('window.RESPONSIVE_PAPER_READY_TO_RENDER === true', { polling: 50, timeout: renderTimeout })
        timeoutInfo.addConsoleMessage("RESPONSIVE_PAPER_READY_TO_RENDER DETECTED, " + timeoutInfo.msRemaining() + "ms remaining of initial " + timeoutInfo.timeout + "ms timeout")
      }
      catch (e) {
        timeoutInfo.addConsoleMessage("WARNING: RESPONSIVE_PAPER_READY_TO_RENDER TIMED OUT, please set waitForReadyToRender = false in options to skip waiting ")
        timeoutInfo.addConsoleMessage(timeoutInfo.msRemaining() + "ms remaining of initial " + timeoutInfo.timeout + "ms timeout")
      }
    } else {
      timeoutInfo.addConsoleMessage("NOT WAITING FOR RESPONSIVE_PAPER_READY_TO_RENDER, " + timeoutInfo.msRemaining() + "ms remaining of initial " + timeoutInfo.timeout + "ms timeout")
    }
    rpOptions.readyToRender = true
    //await page.setViewport({ width: 1024, height: 768 })
    const pageTitle = await page.title();

    await page.addScriptTag({ content: opt.version && rpContent.versions[0] !== opt.version ? await rpContent.js(opt.version) : rpContent.rpScriptContents })

    if (imageTimeout === 0) {
      timeoutInfo.addConsoleMessage('WARNING: Not waiting for images, imageTimeout set to 0ms in parameters')
    } else {
      await waitForImages(timeoutInfo)

    }
    if (timeoutInfo.error) return

    await page.evaluate(async (opt, consoleLogs) => {
      if (consoleLogs) {
        rp.logs = rp.logs.concat(consoleLogs)
      }
      await rp.preview(null, opt);
    }, rpOptions, timeoutInfo.consoleLogs)
    if (timeoutInfo.error) return



    //TODO inject page messages to console
    try {
      await page.waitForFunction('window.RESPONSIVE_PAPER_FINISHED === true', { polling: 'raf', timeout: timeoutInfo.msRemaining() - 10 })
    }
    catch (e) {
      if (e.name == 'TimeoutError') {
        throw new Error('window.RESPONSIVE_PAPER_FINISHED not detected')
      }
      else throw e
    }
    if (timeoutInfo.error) return
    await waitForImages(timeoutInfo)

    //This is one way to force images to load, wait for 2 seconds
    await page.evaluate(async (delay) => {
      setTimeout(function () { window.RESPONSIVE_PAPER_DELAY = true }, delay)
    }, chromeOptions.imageDelay)
    await page.waitForFunction('window.RESPONSIVE_PAPER_DELAY === true', { polling: 50, timeout: timeoutInfo.msRemaining() - 10 })

    if (timeoutInfo.error) return

    //TODO, this may not be necessary with new way of checking images
    //await page.screenshot({ fullPage: true });

    if (chromeOptions.emulateMedia == 'screen' && opt.fixedCss != '') {
      await page.addStyleTag({ content: opt.fixedCss })
    }
    const result = await generatePdfStream(timeoutInfo, page, pdfOptions, pageTitle)
    result.cacheLogs = timeoutInfo.cacheLogs
    result.requestLog = timeoutInfo.requestLog

    return result
  }
}

module.exports = generatePdf;