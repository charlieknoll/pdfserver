var debug = require('debug')('pdfserver:browserPagePool');
const genericPool = require('generic-pool');
const browserFactory = require('./browserFactory')
const config = require('./../config')

const poolProvider = {
  browser: null,
  pagePool: null,
  init: async function () {
    browserFactory.then(b => {
      this.browser = b
      this.pagePool = genericPool.createPool(pageFactory, {
        max: config.browserPool.max,
        min: config.browserPool.min,
        maxWaitingClients: config.browserPool.maxWaitingClients,
        autostart: true,
      })
    })

  }
}

const pageFactory = {
  create: async function () {
    try {
      debug('opening incognito context');
      const context = await poolProvider.browser.createIncognitoBrowserContext();
      // Create a new page in a pristine context.
      const page = await context.newPage();
      await page.goto('data:text/html,hi');
      await page.setViewport({
        width: 1920,
        height: 1080,
      });
      return { page: page, context: context };
    } catch (e) {
      //TODO return null and test in consumer?
      console.error('browserPagePool error creating browser page', e);
    }
  },
  destroy: function (pageContext) {
    debug('closing context');
    pageContext.context.close();
  }
};

poolProvider.init()


module.exports = poolProvider;