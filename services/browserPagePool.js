var debug = require('debug')('app:browserPagePool');
const genericPool = require('generic-pool');
const puppeteer = require('puppeteer');
const chromeLaunchOptions = {};

const url = "https://www.google.com"

const factory = {
  create: async function() {
    try {
      debug('launching browser');
      const browser = await puppeteer.launch(chromeLaunchOptions);
      debug('opening new page');
      const page = await browser.newPage();

    //   debug('setting viewport');
    //   await page.setViewport({
    //     width: 800,
    //     height: 420,
    //     deviceScaleFactor: 1.5,
    //   });

       debug('going to' + url);
       await page.goto(url, { waitUntil: 'networkidle0', timeout: 60000 });

      debug('returning page');
      return page;
    } catch (e) {
      console.error('browserPagePool error cretaing browser page', e);
    }
  },
  destroy: function(puppeteer) {
    debug('closing browser');
    puppeteer.close();
  },
};

const browserPool = genericPool.createPool(factory, {
  max: 50,
  min: 2,
  maxWaitingClients: 50,
  autostart: true,
});

module.exports = browserPool;