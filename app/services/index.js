const config = require('../config')
// const bluebird = require('bluebird')

const Redis = require('ioredis');
// bluebird.promisifyAll(redisFactory.RedisClient.prototype);
// bluebird.promisifyAll(redisFactory.Multi.prototype);
// const redis = redisFactory.createClient(config.redis)
const redis = new Redis(config.redis)
const db = require('pg-promise')({})(config.db)
const logger = require('./logger')
const { sendEmail } = require('./sendEmail')
const browserPool = require('./browserPagePool')
module.exports = {
    db: db,
    redis: redis,
    logger: logger,
    sendEmail: sendEmail,
    browserPool: browserPool
}