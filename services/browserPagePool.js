var debug = require('debug')('pdfserver:browserPagePool');
const genericPool = require('generic-pool');
const puppeteer = require('puppeteer');
const launchOptions = {}
launchOptions.args = ["--incognito", "--no-sandbox", "--disable-gpu"];
launchOptions.ignoreHTTPSErrors = true;
launchOptions.pipe = true;

const url = "https://www.google.com"
let browser = null

async function createBrowser() {
  return await puppeteer.launch(launchOptions)
}

const factory = {
  create: async function () {
    try {


      //const browser = await puppeteer.launch(launchOptions);
      debug('opening new page');
      //const page = await browser.newPage();
      const context = await browser.createIncognitoBrowserContext();
      // Create a new page in a pristine context.
      const page = await context.newPage();
      // Do stuff
      //await page.goto(url);
      return { page: page, context: context };

      //   debug('setting viewport');
      //   await page.setViewport({
      //     width: 800,
      //     height: 420,
      //     deviceScaleFactor: 1.5,
      //   });

      //  debug('going to' + url);
      //  await page.goto(url, { waitUntil: 'networkidle0', timeout: 60000 });

      // debug('returning page');
      // return page;
    } catch (e) {
      console.error('browserPagePool error cretaing browser page', e);
    }
  },
  destroy: function (ctx) {
    debug('closing browser');
    ctx.close();
  },
};

const browserPool = genericPool.createPool(factory, {
  max: 50,
  min: 2,
  maxWaitingClients: 50,
  autostart: true,
});

module.exports = browserPool;