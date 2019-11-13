const asyncHandler = require('express-async-handler')
const config = require('../../config')
const logger = require('../../services/logger')
const router = require('express').Router()
const braintree = require('braintree');
const { promisify } = require('util')
const { logEvent } = require('../../models/subscription')



const post = async function (req, res, next) {
  if (req.query.authToken !== config.braintree.webhookToken) {
    res.sendStatus(403)
    return
  }
  const gateway = braintree.connect(config.braintree);
  const parse = promisify(gateway.webhookNotification.parse).bind(gateway.webhookNotification)
  const parseResult = await parse(req.body.bt_signature, req.body.bt_payload)
  if (parseResult.kind == 'check') {
    res.sendStatus(200)
    return
  }
  //kind,subscription.id, timestamp
  await logEvent(parseResult.subscription.id, parseResult.kind, parseResult.timestamp, parseResult.subscription.nextBillingDate)
  res.sendStatus(200)

}


router.post('/', asyncHandler(post))
module.exports = router
