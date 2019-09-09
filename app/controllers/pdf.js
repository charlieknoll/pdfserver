
// const browserPagePool = require('../services/browserPagePool')
const rpContent = require('../services/rpContent')
const util = require('../util')

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

const generatePdf = async (page, opt) => {



  const chromeOptions = {}
  //TODO don't allow for too long a timeout
  chromeOptions.timeout = 30000;
  chromeOptions.emulateMedia = opt.printMedia ? "print" : "screen"
  chromeOptions.renderTimeout = 5000;
  const pdfOptions = {}
  pdfOptions.scale = 1
  pdfOptions.printBackground = true
  opt.waitForReadyToRender = util.checkBoolean(opt.waitForReadyToRender)
  const rpOptions = {}
  rpOptions.landscape = opt.landscape
  rpOptions.showLoading = false;
  rpOptions.hideSource = true;
  rpOptions.format = opt.format;
  rpOptions.debug = opt.includeConsole === "on";
  //rpOptions.readyToFormatPropertyName = opt.readyToFormatPropertyName || "RESPONSIVE_PAPER_READY_TO_RENDER"
  let pageTitle;


  return await runWithTimeout(async (timeoutInfo) => {


    rpOptions.consoleMessages = []

    page.setDefaultNavigationTimeout(chromeOptions.timeout)
    await page.setRequestInterception(true);
    page.on('request', interceptedRequest => {
      if (interceptedRequest.url().includes('responsive-paper.designer'))
        interceptedRequest.abort();
      else
        interceptedRequest.continue();
    });
    page.on('console', msg => {
      //console.log(msg)
      if (!msg._location.url.includes('responsive-paper.designer')) {
        timeoutInfo.pageErrors.push(msg);
        rpOptions.consoleMessages.push(msg._text)
      }
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
    }
    else {
      page.setJavaScriptEnabled(false)
      if (opt.waitForReadyToRender) await page.waitForFunction('window.RESPONSIVE_PAPER_READY_TO_RENDER = true')
      const response = await page.setContent(opt.value, { waitUntil: 'load' })

    }

    if (timeoutInfo.error) return

    if (opt.waitForReadyToRender) await page.waitForFunction('window.RESPONSIVE_PAPER_READY_TO_RENDER === true', { polling: 50, timeout: chromeOptions.renderTimeout })
    //THIS Helps trigger image loading
    // await page.setViewport({ width: 1640, height: 2800 });
    // await page.evaluate(() => { window.scrollBy(0, window.innerHeight); })
    // await page.evaluate(_ => {
    //   window.scrollTo(0, 0);
    // });

    pageTitle = await page.title();
    //async error testing
    //const test = await page.brokenFunction({ content: rpContent.rpScriptContents })
    page.setJavaScriptEnabled(true)

    const rpScriptTag = await page.addScriptTag({ content: opt.version ? await rpContent.rpContentsProvider.js(opt.version) : rpContent.rpScriptContents })
    const rpContentTag = await page.addStyleTag({ content: opt.version ? await rpContent.rpContentsProvider.css(opt.version) : rpContent.rpStyleContents })
    //TODO block reportsjs.designer.css
    //TODO add rp style to override designer
    //const rpStyleTag = await page
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
    await page.waitForFunction('window.RESPONSIVE_PAPER_FINISHED === true', { polling: 'raf', timeout: 5000 })
    // }
    // catch (err) {
    //   //console.log(err)
    //   return

    // }

    if (timeoutInfo.error) return
    // await page.evaluate(() => { window.scrollBy(0, window.innerHeight); })


    const newPdfOptions = await page.evaluate(() => window.RESPONSIVE_PAPER_CHROME_PDF_OPTIONS)
    Object.assign(pdfOptions, newPdfOptions)

    //Don't set margins this way?
    pdfOptions.margin = {
      top: pdfOptions.marginTop,
      right: pdfOptions.marginRight,
      bottom: pdfOptions.marginBottom,
      left: pdfOptions.marginLeft
    }
    //TODO delete script, server side styles


    //This seems to force images to completely paint

    await page.evaluate(_ => {
      window.scrollTo(0, 0);
    });
    await page.evaluate(_ => {
      window.scrollTo(0, document.body.scrollHeight);
    });
    await page.screenshot({ fullPage: true });


    const content = await page.pdf(pdfOptions)
    if (timeoutInfo.error) return

    return { content, pageTitle }

  }, chromeOptions.timeout, `pdf generation not completed after ${chromeOptions.timeout}ms`)

}
module.exports = generatePdf;