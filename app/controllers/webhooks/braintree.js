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
  //kind,subscription.id, timestamp
  await logEvent(parseResult.subscription.id, parseResult.kind, parseResult.timestamp, parseResult.subscription.nextBillingDate)
  res.sendStatus(200)
  // var options = {
  //   from: new Date - 24 * 60 * 60 * 1000,
  //   until: new Date,
  //   limit: 200,
  //   start: 0,
  //   order: 'desc',
  //   fields: ['message', 'level', 'timestamp']
  // };
  // logger.query(options, function (err, result) {
  //   if (err) {
  //     throw err;
  //   }
  //   let logs
  //   if (result.file) logs = result.file.filter(l => l.level !== 'info')

  //   //console.log(poolProvider)
  //   res.render(req.baseUrl.substring(1), {
  //     title: 'Admin Dashboard', logs, config: JSON.stringify(config),
  //     pagePool: JSON.stringify({
  //       pending: poolProvider.pagePool.pending,
  //       available: poolProvider.pagePool.available
  //     })
  //   })

  // })
}


router.post('/', asyncHandler(post))
module.exports = router
