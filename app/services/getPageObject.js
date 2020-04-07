const util = require('../util')
const { poolProvider } = require('.')

const getPageObject = async (opt) => {

  //For handling mulitple requests to same URI
  //Move inside run?
  const timeout = util.checkInt(opt.timeout, 40000, 600, 120000)

  await util.waitFor(() => { return poolProvider.pagePool !== null }, '', timeout, 100)
  const instance = await poolProvider.pagePool.acquire()
  //throw new Error('could not acquire page')
  const page = instance.page
  try {
    return await util.runWithTimeout(run, timeout, `object not returned after ${timeout}ms`)
  }
  finally {
    //TODO Instead of destroy, call release and delete cookies, navigate back, verify "Hi" is content of page, if not destroy
    //TODO maybe only do that in production so that in debug mode cache is invalidated every request?
    await poolProvider.pagePool.destroy(instance)
  }



  async function run(timeoutInfo) {
    timeoutInfo.requestLog = {
      request_time: timeoutInfo.startTime,
      delay: 0,
      network_data: 0,
      cached_data: 0,
      from_cache_data: 0,
      file_size: 0,
      duration: function () {
        return (new Date - this.request_time)
      }
    }
    timeoutInfo.addConsoleMessage("Processing started")
    await page.setDefaultNavigationTimeout(timeoutInfo.msRemaining())


    const response = await page.goto(opt.value, { waitUntil: 'load' })
    if (response._status !== 200) {
      const msg = "Chrome could not navigate to page: " + response._status + " - " + response._statusText + " " + opt.value
      timeoutInfo.addConsoleMessage(msg)
      throw new Error(msg)
    }
    timeoutInfo.addConsoleMessage("Page loaded")

    if (timeoutInfo.error) return

    //TODO Wait for requested object


    const result = await page.evaluate(async (o) => {
      //split o into array
      const path = o.split(".")
      let result = window
      //iterate over objs stopping if null
      while (path.length > 0) {
        result = result[path.shift()]
      }
      result = result.map(e => {
        e.t = e.t.toJSON()
        return e
      })
      return result
    }, opt.o)
    return result
  }
}

module.exports = getPageObject;