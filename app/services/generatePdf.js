const rpContent = require('./rpContent')
const util = require('../util')
const convertOptions = require('./convertOptions')
const wirePageEvents = require('./wirePageEvents')
const generatePdfStream = require('./generatePdfStream')
const { db, logger, poolProvider } = require('.')


const generatePdf = async (opt) => {
  //TODO acquire and release page here
  const { chromeOptions, pdfOptions, rpOptions } = convertOptions(opt)
  const requestCache = {} //For handling mulitple requests to same URI
  let pageTitle;
  await util.waitFor(() => { return poolProvider.pagePool !== null }, '', 10000, 100)
  const instance = await poolProvider.pagePool.acquire()
  const page = instance.page
  try {
    return await util.runWithTimeout(run, rpOptions.timeout, `pdf generation not completed after ${rpOptions.timeout}ms`)
  }
  finally {
    //TODO Instead of destroy, call release and delete cookies, navigate back, verify "Hi" is content of page, if not destroy
    //TODO maybe only do that in production so that in debug mode cache is invalidated every request?
    await poolProvider.pagePool.destroy(instance)
  }
  async function waitForImages() {
    await util.waitFor(() => { return !Object.keys(requestCache).map(u => requestCache[u].complete ? 0 : 1).reduce((total, nc) => total + nc) }, '', rpOptions.msRemaining(), 100)
  }
  async function run(timeoutInfo) {
    rpOptions.addConsoleMessage("Processing started")
    page.setDefaultNavigationTimeout(rpOptions.msRemaining())
    await page.setRequestInterception(true);
    wirePageEvents(page, rpOptions, requestCache, opt, timeoutInfo)

    page.emulateMedia(chromeOptions.emulateMedia)
    if (opt.value.substring(0, 4).toLowerCase() === 'http') {
      const response = await page.goto(opt.value, { waitUntil: 'load' })
      if (response._status !== 200) {
        const msg = "Chrome could not navigate to page: " + response._status + " - " + response._statusText + ", host may be unreachable: " + opt.value
        timeoutInfo.pageErrors.push(msg);
        throw new Error("Navigation error: " + "Chrome could not navigate to page: " + response._status + " - " + response._statusText + ", host may be unreachable: " + opt.value)
      }
      rpOptions.consoleMessages.push(util.getTimeStamp() + ": Page loaded")
    }
    else {
      const response = await page.setContent(opt.value, { waitUntil: 'load' })
    }

    if (timeoutInfo.error) return

    const msRemaining = rpOptions.msRemaining()
    if (opt.waitForReadyToRender) {
      try {
        //If more than 2000ms remain to render then wait for remaining ms less 50% of the msRemaining over 2000 up to 500ms
        const renderTimeout = msRemaining < 2000 ? msRemaining : msRemaining - Math.min(Math.round(((msRemaining - 2000) * .5)), 500)
        rpOptions.addConsoleMessage("WAITING FOR RESPONSIVE_PAPER_READY_TO_RENDER for " + renderTimeout + "ms")
        await page.waitForFunction('window.RESPONSIVE_PAPER_READY_TO_RENDER === true', { polling: 50, timeout: renderTimeout })
        rpOptions.addConsoleMessage("RESPONSIVE_PAPER_READY_TO_RENDER DETECTED, " + rpOptions.msRemaining() + "ms remaining of initial " + rpOptions.timeout + "ms timeout")
      }
      catch (e) {
        rpOptions.addConsoleMessage("WARNING: RESPONSIVE_PAPER_READY_TO_RENDER TIMED OUT, please set waitForReadyToRender = false in options to skip waiting ")
        rpOptions.addConsoleMessage(rpOptions.msRemaining() + "ms remaining of initial " + rpOptions.timeout + "ms timeout")
      }
    } else {
      rpOptions.addConsoleMessage("NOT WAITING FOR RESPONSIVE_PAPER_READY_TO_RENDER, " + rpOptions.msRemaining() + "ms remaining of initial " + rpOptions.timeout + "ms timeout")
    }
    rpOptions.readyToRender = true

    pageTitle = await page.title();

    const rpScriptTag = await page.addScriptTag({ content: opt.version && rpContent.versions[0] !== opt.version ? await rpContent.js(opt.version) : rpContent.rpScriptContents })
    const rpContentTag = await page.addStyleTag({ content: opt.version && rpContent.versions[0] !== opt.version ? await rpContent.rpContentsProvider.css(opt.version) : rpContent.rpStyleContents })

    page.on('pageerror', msg => {
      timeoutInfo.pageErrors.push(msg);
    });

    await page.evaluate(async (opt) => {
      opt.consoleMessages.forEach(m => {
        console.log(m)
      });
      await rp.preview(null, opt);
    }, rpOptions)
    if (timeoutInfo.error) return

    //TODO calc remaining timeout from total timeout
    //await util.waitFor(() => { return !Object.keys(requestCache).map(u => requestCache[u].complete ? 0 : 1).reduce((total, nc) => total + nc) }, '', rpOptions.msRemaining(), 100)
    await waitForImages()
    if (timeoutInfo.error) return

    //TODO inject page messages to console
    await page.waitForFunction('window.RESPONSIVE_PAPER_FINISHED === true', { polling: 'raf', timeout: rpOptions.msRemaining() })
    if (timeoutInfo.error) return

    // //This is one way to force images to load, wait for 2 seconds
    // await page.evaluate(async (delay) => {
    //   setTimeout(function () { window.RESPONSIVE_PAPER_DELAY = true }, delay)
    // }, chromeOptions.imageDelay)
    // await page.waitForFunction('window.RESPONSIVE_PAPER_DELAY === true', { polling: 50, timeout: rpOptions.msRemaining() })

    await waitForImages()
    // await util.waitFor(() => { return !Object.keys(requestCache).map(u => requestCache[u].complete ? 0 : 1).reduce((total, nc) => total + nc) }, '', rpOptions.msRemaining(), 100)

    if (timeoutInfo.error) return

    //TODO, this may not be necessary with new way of checking images
    //await page.screenshot({ fullPage: true });


    return generatePdfStream(timeoutInfo, page, pdfOptions, pageTitle)
  }
}

module.exports = generatePdf;