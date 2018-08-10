var debug = require('debug')('pdfserver:browserPagePool');
const genericPool = require('generic-pool');

const browserFactory = require('./browser')
let browser
let browserPoolInstance


const factory = {
  create: async function () {
    try {
      debug('opening incognito context');
      const context = await browser.createIncognitoBrowserContext();
      // Create a new page in a pristine context.
      const page = await context.newPage();
      await page.goto('data:text/html,hi');
      return { page: page, context: context };
    } catch (e) {
      //TODO return null and test in consumer?
      console.error('browserPagePool error creating browser page', e);
    }
  },
  destroy: function (pageContext) {
    debug('closing context');
    pageContext.context.close();
  },
};

browserFactory.then(b => {
  browser = b
  browserPoolInstance = genericPool.createPool(factory, {
    max: 2,
    min: 2,
    maxWaitingClients: 50,
    autostart: true,
  })
})

const browserPool = function () {
  return browserPoolInstance
}

module.exports = browserPool;