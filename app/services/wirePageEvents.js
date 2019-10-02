const { redis } = require('.')
const util = require('../util')

module.exports = function wirePageEvents(page, rpOptions, requestCache, opt, timeoutInfo) {

  page.on('console', msg => {
    timeoutInfo.pageErrors.push(msg);
    rpOptions.consoleMessages.push(msg._text)
  })
  page.on('request', async request => {
    const url = request.url();
    if (url.includes('responsive-paper.designer') ||
      url.includes('responsive-paper.settings')) {
      await request.respond({ status: 204 });
      return;
    }
    else {
      // if (request._resourceType === 'image' && rpOptions.readyToRender && requestCache[url] && requestCache[url].complete) {
      //   //TODO load from requestCache
      //   requestCache[url].fromCache = true
      //   await request.respond(requestCache[url].response);
      //   return
      // }
      rpOptions.consoleMessages.push(util.getTimeStamp() + ": Requesting " + url)
      if (requestCache[url] && !requestCache[url].complete) {
        rpOptions.consoleMessages.push(util.getTimeStamp() + ": Waiting " + url)
        await util.waitFor((url) => { return (requestCache[url] && requestCache[url].complete) }, url, rpOptions.msRemaining(), 10)
        rpOptions.consoleMessages.push(util.getTimeStamp() + ": Waiting complete" + url)
      }
      if (!requestCache[url]) {
        requestCache[url] = {
          complete: false,
          fromCache: false
        };
      }
      else {
        requestCache[url].complete = false
      }

      if (!(redis.status == 'ready')) {
        request.continue()
        return
      }

      if (!opt.disableCache) {
        try {
          const cachedRequest = await redis.get(opt.apikey + ":" + url) || await redis.get(url)
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
    if (requestCache[url] && requestCache[url].fromCache) {
      requestCache[url].complete = true
      rpOptions.consoleMessages.push(util.getTimeStamp() + ": From Cache " + url)
      return;
    }
    const headers = response.headers();
    const cacheControl = headers['cache-control'] || '';
    const maxAgeMatch = cacheControl.match(/max-age=(\d+)/);
    const maxAge = maxAgeMatch && maxAgeMatch.length > 1 ? parseInt(maxAgeMatch[1], 10) : 0;
    rpOptions.consoleMessages.push(util.getTimeStamp() + ": Received " + url)


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
        }

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
    if (requestCache[url]) requestCache[url].complete = true
  });


}