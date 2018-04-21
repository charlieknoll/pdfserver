
const browserPagePool = require('../services/browserPagePool')
const url = require('url')

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

const generatePdf = async (req, res) => {
  const launchOptions = {}
  const chromeOptions = {}
  chromeOptions.timeout = 10000;
  chromeOptions.waitForLoad = true
  chromeOptions.scale = 1
  chromeOptions.waitForJS = true
  chromeOptions.printBackground = true


  let page
  
  try {
    await runWithTimeout(async (timeoutInfo) => {
      try {
        //browser = await puppeteer.launch(launchOptions)

        // if (timeoutInfo.error) {
        //   return
        // }
        //const page = await browser.newPage()
        page = await browserPagePool.acquire();

        if (timeoutInfo.error) {
            if (page) await browserPagePool.release(page)
            return
            
        }

        const htmlUrl = url.format({
            protocol: 'http',
            pathname: req.body.url
        })
        
        page.setDefaultNavigationTimeout(chromeOptions.timeout)

        await page.goto(
          htmlUrl,
          boolOrUndefined(chromeOptions.waitForLoad) === true
            ? { waitUntil: 'load' }
            : { }
        )
        if (timeoutInfo.error) {
          await browserPagePool.release(page)
          return
        }
        if (chromeOptions.waitForJS === true || chromeOptions.waitForJS === 'true') {
          
          await page.waitForFunction('window.RESPONSIVE_PAPER_FINISHED === true', { polling: 'raf', timeout: chromeOptions.timeout })

        }       
        const newChromeSettings = await page.evaluate( () => window.RESPONSIVE_PAPER_CHROME_PDF_OPTIONS)
        Object.assign(chromeOptions, newChromeSettings)
        chromeOptions.margin = {
          top: chromeOptions.marginTop,
          right: chromeOptions.marginRight,
          bottom: chromeOptions.marginBottom,
          left: chromeOptions.marginLeft
        }

        if (timeoutInfo.error) {
          if (page) await browserPagePool.release(page)
          return
        }         
        const content = await page.pdf(chromeOptions)
        await browserPagePool.release(page);
        if (timeoutInfo.error) {
          
          return
        }
        res.setHeader('Content-Length', content.length);
        res.contentType('application/pdf')
        //res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=${req.body.fileName}.pdf`);
        //res.meta.fileExtension = 'pdf'
        res.send(content)
        res.end()

      } finally {
        // this block can be fired when there is a timeout and
        // runWithTimeout was resolved but we cancel the code branch with "return"
        if (page) await browserPagePool.release(page)
      }
    }, chromeOptions.timeout, `pdf generation not completed after ${chromeOptions.timeout}ms`)
  } finally {
    if (page) await browserPagePool.release(page)
  }

}


module.exports = generatePdf;