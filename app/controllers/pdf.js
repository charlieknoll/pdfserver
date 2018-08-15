
// const browserPagePool = require('../services/browserPagePool')
const rpContent = require('../services/rpContent')

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
  chromeOptions.timeout = 20000;
  chromeOptions.waitForJs = opt.waitForJs;
  chromeOptions.emulateMedia = opt.printMedia ? "print" : "screen"

  const pdfOptions = {}
  pdfOptions.scale = 1
  pdfOptions.printBackground = true

  const rpOptions = {}
  rpOptions.landscape = opt.landscape ? true : false
  rpOptions.showLoading = false;
  rpOptions.hideSource = true;
  rpOptions.format = opt.format;
  let pageTitle;


  return await runWithTimeout(async (timeoutInfo) => {




    page.setDefaultNavigationTimeout(chromeOptions.timeout)

    if (opt.value.substring(0, 4).toLowerCase() === 'http') {
      const response = await page.goto(opt.value, { waitUntil: 'load' })
    }
    else {
      const response = await page.setContent(opt.value, { waitUntil: 'load' })

    }


    //if (timeoutInfo.error) return
    pageTitle = await page.title();
    //async error testing
    //const test = await page.brokenFunction({ content: rpContent.rpScriptContents })
    const rpScriptTag = await page.addScriptTag({ content: rpContent.rpScriptContents })
    const rpContentTag = await page.addStyleTag({ content: rpContent.rpStyleContents })
    //TODO block reportsjs.designer.css
    //TODO add rjs style to override designer
    //const rpStyleTag = await page
    page.on('pageerror', msg => {
      timeoutInfo.pageErrors.push(msg);
    });
    page.emulateMedia(chromeOptions.emulateMedia)
    //run preview with rpOptions
    await page.evaluate(opt => {
      rjs.preview(null, opt);
    }, rpOptions)

    //if (timeoutInfo.error) return

    await page.waitForFunction('window.RESPONSIVE_PAPER_FINISHED === true', { polling: 'raf', timeout: chromeOptions.timeout })

    //if (timeoutInfo.error) return

    const newPdfOptions = await page.evaluate(() => window.RESPONSIVE_PAPER_CHROME_PDF_OPTIONS)
    Object.assign(pdfOptions, newPdfOptions)
    pdfOptions.margin = {
      top: pdfOptions.marginTop,
      right: pdfOptions.marginRight,
      bottom: pdfOptions.marginBottom,
      left: pdfOptions.marginLeft
    }
    //TODO delete script, server side styles

    const content = await page.pdf(pdfOptions)
    //if (timeoutInfo.error) return

    return { content, pageTitle }

  }, chromeOptions.timeout, `pdf generation not completed after ${chromeOptions.timeout}ms`)

}
module.exports = generatePdf;