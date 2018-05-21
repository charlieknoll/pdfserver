
const browserPagePool = require('../services/browserPagePool')
const rpScript = require('../services/rpScript')

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

const generatePdf = async (opt) => {



  const chromeOptions = {}
  chromeOptions.timeout = 10000;
  chromeOptions.waitForJs = opt.waitForJs;

  const pdfOptions = {}
  pdfOptions.scale = 1
  pdfOptions.printBackground = true

  const rpOptions = {}
  rpOptions.landscape = boolOrUndefined(opt.landscape)
  rpOptions.showLoading = false;
  rpOptions.hideSource = true;


  return await runWithTimeout(async (timeoutInfo) => {
    let page
    let pageReleased = false
    try {
      page = await browserPagePool.acquire();
      if (timeoutInfo.error) return

      page.setDefaultNavigationTimeout(chromeOptions.timeout)

      await page.goto(opt.url, { waitUntil: 'load' })

      if (timeoutInfo.error) return

      //TODO inject rp
      const rpScriptTag = await page.addScriptTag({ content: rpScript })
      page.on('pageerror', msg => {
        timeoutInfo.pageErrors.push(msg);
      });
      //run preview with rpOptions
      try {
        await page.evaluate(opt => {

          rjs.preview([document.getElementById('report')], opt);
        }, rpOptions)
      } catch (e) {
        console.log('exception on evaluate', e)
      }



      await page.waitForFunction('window.RESPONSIVE_PAPER_FINISHED === true', { polling: 'raf', timeout: chromeOptions.timeout })

      const newPdfOptions = await page.evaluate(() => window.RESPONSIVE_PAPER_CHROME_PDF_OPTIONS)
      Object.assign(pdfOptions, newPdfOptions)
      pdfOptions.margin = {
        top: pdfOptions.marginTop,
        right: pdfOptions.marginRight,
        bottom: pdfOptions.marginBottom,
        left: pdfOptions.marginLeft
      }
      if (timeoutInfo.error) return

      //TODO delete script

      const content = await page.pdf(pdfOptions)
      if (timeoutInfo.error) return
      await browserPagePool.release(page).then(() => {
        pageReleased = true
      });

      return content
    } finally {
      if (page && !pageReleased) await browserPagePool.release(page)
    }
  }, chromeOptions.timeout, `pdf generation not completed after ${chromeOptions.timeout}ms`)

}
module.exports = generatePdf;