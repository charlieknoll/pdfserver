const { waitFor } = require('../util')
const { redis } = require('.')

function WaitLimit(options) {


  async function waitHandler(req, res, next) {

    const key = options.keyGenerator(req, res);
    const maxResult =
      typeof options.max === "function" ? options.max(req, res) : options.max;

    await waitFor(
      async function (key, maxResult) {
        const keyResult = await redis.get(key)
        if (!keyResult) return true
        return keyResult < maxResult
      },
      [key, maxResult], options.maxDelay, 500)
    next()
  }
  return waitHandler;
}

module.exports = WaitLimit;