var debug = require('debug')('pdfserver:browserPagePool');
const genericPool = require('generic-pool');
// const browser = require('./browser');
//const puppeteer = require('puppeteer');
// const launchOptions = {}
// launchOptions.args = ["--incognito", "--no-sandbox", "--disable-gpu"];
// launchOptions.ignoreHTTPSErrors = true;
// launchOptions.pipe = true;

// const url = "https://www.google.com"
let browser;


const factory = {
  // validate: async function () {
  //   if (this.browser === undefined) {
  //     this.browser =  await puppeteer.launch(launchOptions);
  //     debug('opening browser');
  //   }
  //   return true;

  // },
  create: async function () {
    try {
      // if (browser === undefined) {
      //   browser = await puppeteer.launch(launchOptions)
      //   debug('opening browser');
      // }

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
  destroy: function (pageContext) {
    debug('closing browser');
    pageContext.context.close();
  },
};
const browserPool = function(b) {
  browser = b;
  browser._testid = '9999'
  return genericPool.createPool(factory, {
  max: 2,
  min: 2,
  maxWaitingClients: 50,
  autostart: true,
});
}

module.exports = browserPool;