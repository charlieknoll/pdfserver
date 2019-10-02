const config = require('../config')
const Redis = require('ioredis');
const redis = new Redis(config.redis)
const db = require('pg-promise')({})(config.db)
const logger = require('./logger')
const { sendEmail } = require('./sendEmail')
const poolProvider = require('./poolProvider')
module.exports = {
    db: db,
    redis: redis,
    logger: logger,
    sendEmail: sendEmail,
    poolProvider: poolProvider
}