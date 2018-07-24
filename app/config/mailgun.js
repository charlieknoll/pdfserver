
var config = require('.')
module.exports = require('mailgun-js')({ apiKey: config.mailgun.apikey, domain: config.mailgun.domain });