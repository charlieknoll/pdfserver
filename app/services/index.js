const config = require('../config')
const db = require('pg-promise')({})(config.db)
const logger = require('./logger')
const { sendEmail } = require('./sendEmail')

module.exports = {
    db: db,
    logger: logger,
    sendEmail: sendEmail
}