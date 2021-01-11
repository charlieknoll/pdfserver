const { validationResult, body } = require('express-validator');
const { sanitizeBody } = require('express-validator');
const viewPath = require('../../middlewares/viewPath')
const router = require('express').Router().use(viewPath)
const asyncHandler = require('express-async-handler')
const config = require('../../config')

const braintree = require('braintree');

const { promisify } = require('util')

const { db } = require('../../services')
const checkResult = function (o) {
  if (!o.success) throw new Error(o.message)
  return o
}

const get = async function (req, res, next) {

  //get subscriptions
  const result = await db.manyOrNone(`
SELECT subscription.id
    ,pricing_plan.name
    ,pricing_plan.price
    ,subscription.pricing_plan_id
	,subscription.start_date
	,subscription.cancel_date
	,TO_CHAR(subscription.next_charge_date, 'mm/dd/yy') next_charge_date
	,subscription.used_credits
	,subscription.credits
	,subscription.rate_limit
    ,subscription.concurrent_limit
    ,subscription.payment_method_descr
    ,subscription.expiration
    ,case when subscription.used_credits >= subscription.credits THEN 'No credits remaining' else subscription.status end
FROM subscription
INNER JOIN pricing_plan ON subscription.pricing_plan_id = pricing_plan.id and pricing_plan.id <> 1
WHERE subscription.user_id = $1
ORDER BY subscription.cancel_date desc, subscription.start_date asc  `, req.user.id)

  //get tx's for subscriptions
  
  const gateway = new braintree.BraintreeGateway(config.braintree)
  const findSubscription = promisify(gateway.subscription.find).bind(gateway.subscription)

  let txs = []


  for (let i = 0; i < result.length; i++) {
    try {
      const subResult = await findSubscription(result[i].id)
      const sTxs = await subResult.transactions

      sTxs.forEach(t => {
        if (t.status === 'settled' || t.status === 'settling' || t.status == 'voided') {
          txs.push({
            subscriptionId: result[i].id,
            txId: t.id,
            status: t.status,
            name: result[i].name,
            date: t.createdAt.substring(0, 10),
            imageUrl: t.paymentInstrumentType == 'credit_card' ? t.creditCard.imageUrl : t.paypal.imageUrl,
            accountDescr: t.paymentInstrumentType == 'credit_card' ? 'ending in ' + t.creditCard.last4 : t.paypal.payerEmail,
            amount: (t.type == 'sale' ? '' : '-') + t.amount
          })
        }
      }, txs)
    } catch (e) {
      //console.log(e)
    }
  }
  txs.sort((a, b) => { return a.date < b.date })
  res.render(req.viewPath, {
    txs,
    title: 'Billing',
    billing: 'active'
  })
}

router.get('/', asyncHandler(get))

module.exports = router