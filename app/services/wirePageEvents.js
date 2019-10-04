const { redis } = require('.')
const util = require('../util')

module.exports = function wirePageEvents(page, requestCache, opt, timeoutInfo) {
  page.on('pageerror', msg => {
    timeoutInfo.addConsoleMessage(msg._text);
  });

  page.on('console', msg => {
    timeoutInfo.addConsoleMessage(msg._text);
  })
  page.on('request', async request => {
    const url = request.url();
    if (url.includes('responsive-paper.designer') ||
      url.includes('responsive-paper.settings')) {
      await request.respond({ status: 204 });
      return;
    }
    else {
      if (!requestCache[url]) {
        requestCache[url] = {
          complete: false,
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
        request.continue()
        return
      }

      if (!opt.disableCache) {
        try {
          const cachedRequest = await redis.get(url) || await redis.get(opt.apikey + ":" + url)
          //const cachedRequest = cache[url]
          if (cachedRequest) {
            requestCache[url].fromCache = true
            const parsed = JSON.parse(cachedRequest)
            parsed.body = Buffer.from(parsed.body, 'hex')
            await request.respond(parsed);
            return;
          }
        } catch (error) { }
      }
      else {
        try {
          await redis.delAsync(opt.apikey + ":" + url)
        } catch (error) { }
      }

      request.continue();
    }

  });
  page.on('response', async (response) => {
    if (response._status === 204) {
      return
    }
    const url = response.url();
    requestCache[url].complete = true
    if (requestCache[url] && (requestCache[url].fromCache || requestCache[url].fromMemCache)) {
      //timeoutInfo.addConsoleMessage("From" + (requestCache[url].fromMemCache ? " Mem" : "") + " Cache " + url)
      if (requestCache[url].fromCache) timeoutInfo.addConsoleMessage("From Cache " + url)
      return;
    }
    const headers = response.headers();
    const cacheControl = headers['cache-control'] || '';
    const maxAgeMatch = cacheControl.match(/max-age=(\d+)/);
    const maxAge = maxAgeMatch && maxAgeMatch.length > 1 ? parseInt(maxAgeMatch[1], 10) : 0;
    timeoutInfo.addConsoleMessage("Received " + url)


    //TODO use public to store in public cache?
    if (maxAge && !opt.disableCache && redis.status == 'ready' || (response._request._resourceType === "image")) {
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
            status: response.status(),
            headers: response.headers(),
            body: buffer
          };
          //timeoutInfo.addConsoleMessage("MEM CACHE inserted: " + url)
        }
        if (!maxAge || !opt.disableCache || !redis.status == 'ready') return
        const cacheKey = cacheControl.includes('public') ? url : opt.apikey + ':' + url
        try {
          await redis.setex(cacheKey, maxAge, JSON.stringify(
            {
              status: response.status(),
              headers: response.headers(),
              body: buffer.toString('hex'),
              expires: Date.now() + (maxAge * 1000)
            }))
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