
const browserPagePool = require('../services/browserPagePool')

const runWithTimeout = (fn, ms, msg) => {
  return new Promise(async (resolve, reject) => {
    let resolved = false

    const info = {
      // information to pass to fn to ensure it can cancel
      // things if it needs to
      error: null
    }

    const timer = setTimeout(() => {
      const err = new Error(`Timeout Error: ${msg}`)
      info.error = err
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

const generatePdf = async (url,opt) => {



  const chromeOptions = {}
  chromeOptions.timeout = 10000;
  chromeOptions.waitForLoad = true
  chromeOptions.scale = 1
  chromeOptions.waitForJS = true
  chromeOptions.printBackground = true
  Object.assign(chromeOptions, opt)



  return await runWithTimeout(async (timeoutInfo) => {
    let page
    let pageReleased = false
    try {
      page = await browserPagePool.acquire();
      if (timeoutInfo.error) return

      page.setDefaultNavigationTimeout(chromeOptions.timeout)

      await page.goto(
        url,
        boolOrUndefined(chromeOptions.waitForLoad) === true
          ? { waitUntil: 'load' }
          : {}
      )
      if (timeoutInfo.error) return
      
      if (chromeOptions.waitForJS === true || chromeOptions.waitForJS === 'true') {
        await page.waitForFunction('window.RESPONSIVE_PAPER_FINISHED === true', { polling: 'raf', timeout: chromeOptions.timeout })
      }
      const newChromeSettings = await page.evaluate(() => window.RESPONSIVE_PAPER_CHROME_PDF_OPTIONS)
      Object.assign(chromeOptions, newChromeSettings)
      chromeOptions.margin = {
        top: chromeOptions.marginTop,
        right: chromeOptions.marginRight,
        bottom: chromeOptions.marginBottom,
        left: chromeOptions.marginLeft
      }
      if (timeoutInfo.error) return

      const content = await page.pdf(chromeOptions)
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