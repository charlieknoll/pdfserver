const { redis } = require('.')
const util = require('../util')
const fixMedia = require('./chromeScreenMediaFix')

module.exports = function wirePageEvents(page, requestCache, opt, timeoutInfo) {
  opt.fixedCss = ""
  page.on('pageerror', msg => {
    timeoutInfo.addConsoleMessage(msg._text);
  });

  page.on('console', msg => {
    timeoutInfo.addConsoleMessage(msg._text);
  })
  page.on('request', async request => {
    const url = await request.url();
    if (url.includes('responsive-paper.designer') ||
      url.includes('responsive-paper.settings')) {
      await request.respond({ status: 204 });
      return;
    }
    else {
      if (!requestCache[url]) {
        requestCache[url] = {
          complete: false,
          resourceType: request._resourceType
          //fromCache: false
        };
      }
      else {
        requestCache[url].complete = false
      }
      if (request._resourceType === 'image' && requestCache[url] && requestCache[url].response) {
        requestCache[url].fromMemCache = true
        //timeoutInfo.addConsoleMessage("Responding from Mem Cache " + url)
        await request.respond(requestCache[url].response);
        return
      }
      //timeoutInfo.addConsoleMessage("Requesting " + url)

      // if (requestCache[url] && !requestCache[url].complete) {
      //   timeoutInfo.addConsoleMessage("Waiting " + url)
      //   await util.waitFor((url) => { return (requestCache[url] && requestCache[url].complete) }, url, timeoutInfo.msRemaining(), 10)
      //   timeoutInfo.addConsoleMessage("Waiting complete" + url)
      // }

      if (!(redis.status == 'ready')) {
        await request.continue()
        return
      }

      const redisKey = url.substring(0, 300)
      const redisApiKey = (opt.apikey + ":" + url).substring(0, 300)
      if (!opt.disableCache) {
        try {
          let cachedRequest = await redis.get(redisKey)
          if (!cachedRequest) cachedRequest = await redis.get(redisApiKey)
          //const cachedRequest = cache[url]
          if (cachedRequest) {
            requestCache[url].fromCache = true
            const parsed = JSON.parse(cachedRequest)
            timeoutInfo.requestLog.from_cache_data += parsed.body.length
            parsed.body = Buffer.from(parsed.body, 'hex')
            if (request._resourceType === "stylesheet") {
              opt.fixedCss += fixMedia(parsed.body.toString())
            }
            await request.respond(parsed);
            return;
          }
        } catch (error) { }
      }
      else {
        try {
          await redis.del(redisApiKey)
        } catch (error) {
          console.log(error)
        }
      }

      await request.continue();
    }

  });

  page.on('response', async (response) => {
    const url = await response.url();
    if (response._status !== 200) {
      //set request complete
      if (requestCache[url]) {
        requestCache[url].complete = true
      }
      return
    }

    requestCache[url].complete = true
    if (requestCache[url] && (requestCache[url].fromCache || requestCache[url].fromMemCache)) {
      //timeoutInfo.addConsoleMessage("From" + (requestCache[url].fromMemCache ? " Mem" : "") + " Cache " + url)
      if (requestCache[url].fromCache) timeoutInfo.addConsoleMessage("From Cache " + url)
      return;
    }
    const headers = await response.headers();
    const cacheControl = headers['cache-control'] || '';
    const maxAgeMatch = cacheControl.match(/max-age=(\d+)/);
    const maxAge = maxAgeMatch && maxAgeMatch.length > 1 ? parseInt(maxAgeMatch[1], 10) : 0;
    timeoutInfo.addConsoleMessage("Received " + url)
    timeoutInfo.requestLog.network_data += util.checkInt(response._headers['content-length'], 0, 0)

    //TODO use public to store in public cache?
    if (maxAge && !opt.disableCache && redis.status == 'ready' || (response._request._resourceType === "image") || (response._request._resourceType === "stylesheet")) {
      let buffer;
      try {
        buffer = await response.buffer();
      } catch (error) {
        // some responses do not contain buffer and do not need to be catched
        requestCache[url].complete = true
        return;
      }

      if (buffer.byteLength > 0) {
        if (response._request._resourceType === "image") {
          requestCache[url].response = {
            status: await response.status(),
            headers: await response.headers(),
            body: buffer
          };
        }
        if (response._request._resourceType === "stylesheet") {
          opt.fixedCss += fixMedia(buffer.toString())
        }
        if (!maxAge || opt.disableCache || !redis.status == 'ready') return
        const cacheKey = (cacheControl.includes('public') ? url : opt.apikey + ':' + url).substring(0, 300)
        try {
          if (await redis.exists(cacheKey)) return
          const bufStr = buffer.toString('hex')
          await redis.setex(cacheKey, maxAge, JSON.stringify(
            {
              status: response.status(),
              headers: response.headers(),
              body: bufStr,
              expires: Date.now() + (maxAge * 1000)
            }))
          timeoutInfo.requestLog.cached_data += bufStr.length
          timeoutInfo.cacheLogs.push(
            {
              request_type: response._request._resourceType,
              cache_key: cacheKey,
              expires: Date.now() + (maxAge * 1000),
              size: bufStr.length
            }
          )

        }
        catch (error) {
          //Kill error just in case cache write fails, no big deal
          //TODO log these errors to winston

        }
      }
    }
    //if (requestCache[url]) requestCache[url].complete = true
  });


}