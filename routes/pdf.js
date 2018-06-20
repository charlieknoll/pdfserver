
// const browserPagePool = require('../services/browserPagePool')
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

const generatePdf = async (pool, opt) => {



  const chromeOptions = {}
  chromeOptions.timeout = 100000;
  chromeOptions.waitForJs = opt.waitForJs;
  chromeOptions.emulateMedia = opt.printMedia ? "print" : "screen"

  const pdfOptions = {}
  pdfOptions.scale = 1
  pdfOptions.printBackground = true

  const rpOptions = {}
  rpOptions.landscape = opt.landscape ? true : false
  rpOptions.showLoading = false;
  rpOptions.hideSource = true;


  return await runWithTimeout(async (timeoutInfo) => {
    let page
    let pageReleased = false
    try {
      const pageContext = await pool.acquire();
      page = pageContext.page
      if (timeoutInfo.error) return

      page.setDefaultNavigationTimeout(chromeOptions.timeout)

      const response = await page.goto(opt.url, { waitUntil: 'load' })

      if (timeoutInfo.error) return

      const rpScriptTag = await page.addScriptTag({ content: rpScript })
      //TODO block reportsjs.designer.css
      //TODO add rjs style to override designer
      //const rpStyleTag = await page
      page.on('pageerror', msg => {
        timeoutInfo.pageErrors.push(msg);
      });
      page.emulateMedia(chromeOptions.emulateMedia)
      //run preview with rpOptions
      try {
        await page.evaluate(opt => {

          rjs.preview(null, opt);
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
      try {
        await pool.release(pageContext).then(() => {
          pageReleased = true
        });
      }
      catch (e) {
        console.log(e)
        
      }

      return content
    } finally {
      if (page && !pageReleased) await pool.release(pageContext)
    }
  }, chromeOptions.timeout, `pdf generation not completed after ${chromeOptions.timeout}ms`)

}
module.exports = generatePdf;