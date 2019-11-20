//TODO add a rate limiter, add a max function to resolve the max rate based on apikey
//windowMs: 60*60*1000
//
//TODO use existing
const { redis } = require('.')
const RateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis');
const WaitLimit = require('./wait-limit')

function rateHandler(req, res) {
  const msg = req.rateLimit.current + " requests in past hour exceeds the subscription's " + req.rateLimit.limit + ' hourly request limit.  Upgrade your plan at responsivepaper.com.'
  res.status(this.statusCode).send(msg);
}
function concurrentHandler(req, res) {
  const msg = req.rateLimit.current + " concurrent requests exceeds the subscription's " + req.rateLimit.limit + ' concurrent request limit.  Upgrade your plan at responsivepaper.com.'
  res.status(this.statusCode).send(msg);
}


const signInLimiter = new RateLimit({
  max: 30,
  message: 'Too many attempts, please wait at least 30 minutes and try again.',
  store: new RedisStore({
    client: redis,
    prefix: 'rls',
    expiry: 60 * 30,
  }),

})
const rateLimiter = new RateLimit({
  max: (req) => req.rp.rate_limit,
  keyGenerator: (req) => req.rp.subscription_id,
  handler: rateHandler,
  store: new RedisStore({
    client: redis,
    prefix: 'rlr',
    expiry: 60 * 60,
  }),
})
const concurrentLimiter = new RateLimit({
  max: (req) => req.rp.concurrent_limit,
  keyGenerator: (req) => req.rp.subscription_id,
  handler: concurrentHandler,
  skipFailedRequests: true,
  skipSuccessfulRequests: true,
  store: new RedisStore({
    client: redis,
    prefix: 'rlc',
    expiry: 60 * 60
  }),
})
const waitLimiter = new WaitLimit({
  maxDelay: 10000, //30 seconds max to wait for an available
  keyGenerator: (req) => 'rlc' + req.rp.subscription_id,
  max: (req) => req.rp.concurrent_limit,
})
module.exports = {
  rateLimiter,
  concurrentLimiter,
  signInLimiter,
  waitLimiter
}

