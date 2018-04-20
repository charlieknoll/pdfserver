var express = require('express');
var router = express.Router();
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

function floatOrUndefined(param) {
    try {
        return parseFloat(param)
    } catch (e) {
        return undefined
    }
}

function boolOrUndefined(par) {
    return (par === true || par === 'true') ? true : undefined
}


function execute(launchOptions, chromeOptions) {
    return async (req, res) => {
        const launchOptions = Object.assign({}, launchOptions)

        if (typeof launchOptions.args === 'string') {
            launchOptions.args = launchOptions.args.split(',')
        }

        let browser
        let browserClosed = false

        try {
            await runWithTimeout(async (timeoutInfo) => {
                try {
                    browser = await puppeteer.launch(launchOptions)

                    if (timeoutInfo.error) {
                        return
                    }

                    const page = await browser.newPage()

                    if (timeoutInfo.error) {
                        return
                    }


                    if (boolOrUndefined(chrome.waitForNetworkIddle) === true) {
                        console.log('Chrome will wait for network iddle before printing')
                    }

                    const id = uuid()
                    const htmlPath = path.join(reporter.options.tempAutoCleanupDirectory, `${id}-chrome-pdf.html`)

                    if (!path.isAbsolute(htmlPath)) {
                        throw new Error(`generated htmlPath option must be an absolute path to a file. path: ${htmlPath}`)
                    }

                    await writeFileAsync(htmlPath, res.content.toString())

                    if (timeoutInfo.error) {
                        return
                    }

                    const htmlUrl = url.format({
                        protocol: 'file',
                        pathname: htmlPath
                    })

                    // this is the same as sending timeout options to the page.goto
                    // but additionally setting it more generally in the page
                    page.setDefaultNavigationTimeout(chromeOptions.timeout)

                    await page.goto(
                        htmlUrl,
                        boolOrUndefined(chromeOptions.waitForNetworkIddle) === true
                            ? { waitUntil: 'networkidle2' }
                            : {}
                    )

                    if (timeoutInfo.error) {
                        return
                    }

                    if (chrome.waitForJS === true || chrome.waitForJS === 'true') {
                        reporter.logger.debug('Chrome will wait for printing trigger', req)
                        await page.waitForFunction('window.RESPONSIVE_PAPER_FINISHED === true', { polling: 'raf', timeout: definition.options.timeout })

                    }

                    const newChromeOptions = await page.evaluate(() => window.RESPONSIVE_PAPER_CHROME_PDF_OPTIONS)

                    if (timeoutInfo.error) {
                        return
                    }
                    Object.assign(chromeOptions, newChromeSettings)
                    chrome.margin = {
                        top: chromeOptions.marginTop,
                        right: chromeOptions.marginRight,
                        bottom: chromeOptions.marginBottom,
                        left: chromeOptions.marginLeft
                    }


                    reporter.logger.debug('Running chrome with params ' + JSON.stringify(chrome), req)

                    res.content = await page.pdf(chromeOptions)

                    if (timeoutInfo.error) {
                        return
                    }

                    res.meta.contentType = 'application/pdf'
                    res.meta.fileExtension = 'pdf'
                } finally {
                    // this block can be fired when there is a timeout and
                    // runWithTimeout was resolved but we cancel the code branch with "return"
                    if (browser && !browserClosed) {
                        browserClosed = true
                        await browser.close()
                    }
                }
            }, definition.options.timeout, `pdf generation not completed after ${definition.options.timeout}ms`)
        } finally {
            if (browser && !browserClosed) {
                browserClosed = true
                await browser.close()
            }
        }
    }
}



/* GET home page. */
router.get('/', function (req, res, next) {
    //res.render('index', { title: '2Express' });
    await execute({}, {})(req, res);
});
module.exports = router;