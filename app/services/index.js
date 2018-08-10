const config = require('../config')
const db = require('pg-promise')({})(config.db)
const logger = require('./logger')
const { sendEmail } = require('./sendEmail')
const browserPool = require('./browserPagePool')
module.exports = {
    db: db,
    logger: logger,
    sendEmail: sendEmail,
    browserPool: browserPool
}