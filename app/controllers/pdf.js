
// const browserPagePool = require('../services/browserPagePool')
const rpContent = require('../services/rpContent')
const util = require('../util')
const { redis } = require('../services')
const hummus = require('hummus');
const cache = {}
const PDFWStreamForBuffer = require('./PDFWStreamForBuffer')

const timeout = function (ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
const waitFor = async function (fn, args, ms, interval) {
  let timeoutCtr = 0
  const iterations = ms / interval

  while (timeoutCtr < iterations) {
    timeoutCtr++
    if (await fn(...args)) return true
    await timeout(interval)
  }
  return false

}
const runWithTimeout = (fn, ms, msg) => {
  return new Promise(async (resolve, reject) => {
    let resolved = false

    const info = {
      // information to pass to fn to ensure it can cancel
      // things if it needs to
      error: null,
      pageErrors: [],
      reject: reject
    }

    const timer = setTimeout(() => {
      const err = new Error(`Timeout Error: ${msg}`)
      info.error = err
      err.pageErrors = info.pageErrors
      resolved = true
      reject(err)
    }, ms)

    try {
      const result = await fn(info)

      if (resolved) {
        return
      }

      resolve(result)
    } catch (e) {
      if (resolved) {
        return
      }
      e.pageErrors = info.pageErrors
      reject(e)
    } finally {
      clearTimeout(timer)
    }
  })
}
function boolOrUndefined(par) {
  return (par === true || par === 'true') ? true : undefined
}

const generatePdf = async (res, page, opt) => {


  const requestCache = {} //For handling mulitple requests to same URI

  const chromeOptions = {}
  //TODO don't allow for too long a timeout
  chromeOptions.timeout = 30000;
  chromeOptions.emulateMedia = opt.printMedia ? "print" : "screen"
  chromeOptions.renderTimeout = 5000;

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

  const browserOptions = {}
  browserOptions.requestTimeout = 20000
  browserOptions.imageDelay = opt.imageDelay ? opt.imageDelay : (opt.disableCache ? 1000 : 200)

  //rpOptions.readyToFormatPropertyName = opt.readyToFormatPropertyName || "RESPONSIVE_PAPER_READY_TO_RENDER"
  let pageTitle;


  return await runWithTimeout(async (timeoutInfo) => {

    const startTime = new Date
    let readyToRender = false


    rpOptions.consoleMessages = []
    rpOptions.consoleMessages.push(util.getTimeStamp(startTime) + ": Processing started")
    rpOptions.startTime = startTime


    page.setDefaultNavigationTimeout(chromeOptions.timeout)
    await page.setRequestInterception(true);
    page.on('request', async request => {
      const url = request.url();
      if (url.includes('responsive-paper.designer') ||
        url.includes('responsive-paper.settings')) {
        //interceptedRequest.abort();
        await request.respond({ status: 204 });
        return;
      }
      else {
        if (request._resourceType === 'image' && readyToRender && requestCache[url] && requestCache[url].complete) {
          //TODO load from requestCache
          requestCache[url].fromCache = true
          await request.respond(requestCache[url].response);
          return
        }
        rpOptions.consoleMessages.push(util.getTimeStamp() + ": Requesting " + url)
        if (requestCache[url] && !requestCache[url].complete) {
          rpOptions.consoleMessages.push(util.getTimeStamp() + ": Waiting " + url)
          await waitFor((url) => { return (requestCache[url] && requestCache[url].complete) }, url, browserOptions.requestTimeout, 10)
          rpOptions.consoleMessages.push(util.getTimeStamp() + ": Waiting complete" + url)
        }
        if (!requestCache[url]) {
          requestCache[url] = {
            complete: false,
            fromCache: false
          };
        }
        else {
          requestCache[url].complete = false
        }

        if (!(redis.status == 'ready')) {
          request.continue()
          return
        }

        if (!opt.disableCache) {
          try {
            const cachedRequest = await redis.get(opt.apikey + ":" + url) || await redis.get(url)
            //const cachedRequest = cache[url]
            if (cachedRequest) {
              requestCache[url].fromCache = true
              const parsed = JSON.parse(cachedRequest)
              parsed.body = Buffer.from(parsed.body, 'hex')
              await request.respond(parsed);
              return;
            }
          } catch (error) { }
        }
        else {
          try {
            await redis.delAsync(opt.apikey + ":" + url)
          } catch (error) { }
        }

        request.continue();
      }

    });
    page.on('response', async (response) => {
      if (response._status === 204) {
        return
      }
      const url = response.url();
      if (requestCache[url] && requestCache[url].fromCache) {
        requestCache[url].complete = true
        rpOptions.consoleMessages.push(util.getTimeStamp() + ": From Cache " + url)
        return;
      }
      const headers = response.headers();
      const cacheControl = headers['cache-control'] || '';
      const maxAgeMatch = cacheControl.match(/max-age=(\d+)/);
      const maxAge = maxAgeMatch && maxAgeMatch.length > 1 ? parseInt(maxAgeMatch[1], 10) : 0;
      rpOptions.consoleMessages.push(util.getTimeStamp() + ": Received " + url)


      //TODO use public to store in public cache?
      if (maxAge && !opt.disableCache && redis.status == 'ready' || (response._request._resourceType === "image")) {

        let buffer;
        try {
          buffer = await response.buffer();

        } catch (error) {
          // some responses do not contain buffer and do not need to be catched
          requestCache[url].complete = true
          return;
        }

        if (buffer.byteLength > 0) {
          if (response._request._resourceType === "image") {
            requestCache[url].response = {
              status: response.status(),
              headers: response.headers(),
              body: buffer
            };
          }

          const cacheKey = cacheControl.includes('public') ? url : opt.apikey + ':' + url
          try {
            await redis.setex(cacheKey, maxAge, JSON.stringify(
              {
                status: response.status(),
                headers: response.headers(),
                body: buffer.toString('hex'),
                expires: Date.now() + (maxAge * 1000)
              }))
          }
          catch (error) {
            //Kill error just in case cache write fails, no big deal
            //TODO log these errors to winston

          }
        }
      }
      if (requestCache[url]) requestCache[url].complete = true
    });

    page.on('console', msg => {
      timeoutInfo.pageErrors.push(msg);
      rpOptions.consoleMessages.push(msg._text)
    })
    if (opt.value.substring(0, 4).toLowerCase() === 'http') {
      const response = await page.goto(opt.value,
        { waitUntil: 'load' }
      )
      //TODO handle bad page load (404, 504 gateway timeout)
      if (response._status !== 200) {
        const msg = "Chrome could not navigate to page: " + response._status + " - " + response._statusText + ", host may be unreachable: " + opt.value
        timeoutInfo.pageErrors.push(msg);
        throw new Error("Navigation error: " + "Chrome could not navigate to page: " + response._status + " - " + response._statusText + ", host may be unreachable: " + opt.value)
      }
      rpOptions.consoleMessages.push(util.getTimeStamp() + ": Page loaded")
    }
    else {
      page.setJavaScriptEnabled(false)
      if (opt.waitForReadyToRender) await page.waitForFunction('window.RESPONSIVE_PAPER_READY_TO_RENDER = true')
      const response = await page.setContent(opt.value, { waitUntil: 'load' })

    }

    if (timeoutInfo.error) return

    if (opt.waitForReadyToRender) {
      await page.waitForFunction('window.RESPONSIVE_PAPER_READY_TO_RENDER === true', { polling: 50, timeout: chromeOptions.renderTimeout })
      rpOptions.consoleMessages.push(util.getTimeStamp() + ": RESPONSIVE_PAPER_READY_TO_RENDER DETECTED")
    } else {
      rpOptions.consoleMessages.push(util.getTimeStamp() + ": NOT WAITING FOR RESPONSIVE_PAPER_READY_TO_RENDER")

    }
    readyToRender = true

    pageTitle = await page.title();

    //async error testing
    //const test = await page.brokenFunction({ content: rpContent.rpScriptContents })

    page.setJavaScriptEnabled(true)

    //TODO, this is checking responsivepaper files
    const rpScriptTag = await page.addScriptTag({ content: opt.version && rpContent.versions[0] !== opt.version ? await rpContent.js(opt.version) : rpContent.rpScriptContents })
    const rpContentTag = await page.addStyleTag({ content: opt.version && rpContent.versions[0] !== opt.version ? await rpContent.rpContentsProvider.css(opt.version) : rpContent.rpStyleContents })

    page.on('pageerror', msg => {
      timeoutInfo.pageErrors.push(msg);
    });

    page.emulateMedia(chromeOptions.emulateMedia)
    //run preview with rpOptions
    await page.evaluate(async (opt) => {
      //console.log("DEBUG0: " + opt.debug)
      opt.consoleMessages.forEach(m => {
        console.log(m)
      });
      await rp.preview(null, opt);
    }, rpOptions)

    if (timeoutInfo.error) return


    //await page.waitForFunction('window.RESPONSIVE_PAPER_FINISHED === true', { polling: 'raf', timeout: chromeOptions.timeout })
    // try {
    await waitFor(() => { return !Object.keys(requestCache).map(u => requestCache[u].complete ? 0 : 1).reduce((total, nc) => total + nc) }, '', 10000, 10)

    //TODO inject page messages to console

    await page.waitForFunction('window.RESPONSIVE_PAPER_FINISHED === true', { polling: 'raf', timeout: 5000 })

    //This is one way to force images to load, wait for 2 seconds
    await page.evaluate(async (delay) => {
      setTimeout(function () { window.RESPONSIVE_PAPER_DELAY = true }, delay)
    }, browserOptions.imageDelay)

    await page.waitForFunction('window.RESPONSIVE_PAPER_DELAY === true', { polling: 50, timeout: 5000 })


    if (timeoutInfo.error) return

    const paperSizesByPage = await page.evaluate(() => rp.getPagePaperTypes())

    const paperSizes = paperSizesByPage.filter((ps, i, a) => a.indexOf(ps) === i)
    //TODO, this may not be necessary with new way of checking images
    //await page.screenshot({ fullPage: true });

    let pdfStreams = {}
    for (var i = 0; i < paperSizes.length; i++) {
      const newPdfOptions = await page.evaluate((paperType) => rp.showPaperType(paperType), paperSizes[i])
      Object.assign(pdfOptions, newPdfOptions)
      //Don't set margins this way?
      pdfOptions.margin = {
        top: pdfOptions.marginTop,
        right: pdfOptions.marginRight,
        bottom: pdfOptions.marginBottom,
        left: pdfOptions.marginLeft
      }
      pdfStreams[paperSizes[i]] = await page.pdf(pdfOptions)
    }

    if (timeoutInfo.error) return
    if (paperSizes.length === 1) {
      return { content: pdfStreams[paperSizes[0]], pageTitle }
    }
    try {
      const writeStream = new PDFWStreamForBuffer()
      const pdfWriter = hummus.createWriter(writeStream)
      let cPaperSize = paperSizesByPage[0]
      let pagesToWrite = 1
      for (var i = 0; i < paperSizesByPage.length - 1; i++) {

        if (paperSizesByPage[i + 1] !== cPaperSize) {
          //write out previous index through previ
          const bufferStream = new hummus.PDFRStreamForBuffer(pdfStreams[cPaperSize])
          pdfStreams[cPaperSize].nextPage = pdfStreams[cPaperSize].nextPage ? pdfStreams[cPaperSize].nextPage : 0
          pdfWriter.appendPDFPagesFromPDF(bufferStream,
            { type: hummus.eRangeTypeSpecific, specificRanges: [[pdfStreams[cPaperSize].nextPage, pdfStreams[cPaperSize].nextPage + pagesToWrite - 1]] })
          pdfStreams[cPaperSize].nextPage = pdfStreams[cPaperSize].nextPage + pagesToWrite
          pagesToWrite = 1
          cPaperSize = paperSizesByPage[i + 1]
        }
        else {
          pagesToWrite++
        }
      }
      //Write out last page
      const bufferStream = new hummus.PDFRStreamForBuffer(pdfStreams[cPaperSize])
      pdfStreams[cPaperSize].nextPage = pdfStreams[cPaperSize].nextPage ? pdfStreams[cPaperSize].nextPage : 0
      pdfWriter.appendPDFPagesFromPDF(bufferStream,
        { type: hummus.eRangeTypeSpecific, specificRanges: [[pdfStreams[cPaperSize].nextPage, pdfStreams[cPaperSize].nextPage + pagesToWrite - 1]] })

      pdfWriter.end()
      return { content: writeStream.buffer, pageTitle }
    } catch (error) {
      console.log(error)
    }





    //This seems to force images to completely paint

    // await page.evaluate(_ => {
    //   window.scrollTo(0, 0);
    // });
    // await page.evaluate(_ => {
    //   window.scrollTo(0, document.body.scrollHeight);
    // });





  }, chromeOptions.timeout, `pdf generation not completed after ${chromeOptions.timeout}ms`)

}
module.exports = generatePdf;