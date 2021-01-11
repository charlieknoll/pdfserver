const { db } = require('../../services')
const asyncHandler = require('express-async-handler')
const viewPath = require('../../middlewares/viewPath')
const router = require('express').Router().use(viewPath)
const config = require('../../config')
const braintree = require('braintree');
const { promisify } = require('util')
const { cancel } = require('../../models/subscription')

const checkResult = function (o) {
  if (!o.success) throw new Error(o.message)
  return o
}
const get = async function (req, res, next) {
  const errorMessage = req.session.errorMessage
  delete req.session.errorMessage

  const plan = await db.one(`
SELECT        pricing_plan.name, pricing_plan.price, pricing_plan.price::numeric as num_price, pricing_plan.credits,
pricing_plan.rate_limit, pricing_plan.concurrent_limit, pricing_plan.active
FROM            pricing_plan INNER JOIN subscription ON pricing_plan.id = subscription.pricing_plan_id
and subscription.id = $1 and subscription.user_id = $2
WHERE pricing_plan.id <> 1
                         `, [req.params.subscriptionId, req.user.id])

  res.render(req.viewPath, {
    name: req.user.display_name,
    email: req.user.email,
    title: "Cancel Subscription", errorMessage,
    plan
  })
}
function canVoid(tx) {
  if (tx.status == 'authorized') return true
  if (tx.status == 'submitted_for_settlement') return true
  if (tx.status == 'settlement_pending' && tx.paypal.token) return true
  return false
}
const post = async function (req, res, next) {
  const gateway = new braintree.BraintreeGateway(config.braintree)
  const findSubscription = promisify(gateway.subscription.find).bind(gateway.subscription)
  const voidTransaction = promisify(gateway.transaction.void).bind(gateway.transaction)
  const refundTransaction = promisify(gateway.transaction.refund).bind(gateway.transaction)
  const cancelSubscription = promisify(gateway.subscription.cancel).bind(gateway.subscription)
  let actionMsg
  try {
    const subscription = await db.one(`
    SELECT subscription.id,  subscription.used_credits, subscription.credits, pricing_plan.price::numeric as price, payment_method_descr
    FROM            pricing_plan INNER JOIN subscription ON pricing_plan.id = subscription.pricing_plan_id
    and subscription.id = $1 and subscription.user_id = $2 and subscription.cancel_date is null
    WHERE pricing_plan.id <> 1
    `, [req.params.subscriptionId, req.user.id])

    const subResult = await findSubscription(subscription.id)


    const tx = subResult.transactions[0] //id, status
    //TODO see if Void is possible
    if (canVoid(tx)) {
      const voidResult = await voidTransaction(tx.id)
      if (voidResult.success) {
        actionMsg = 'The transaction for $' + tx.amount + ' has been voided from ' + subscription.payment_method_descr + '.'
      }
      else {
        throw new Error(voidResult.message)
      }
    } else {
      const refund = Math.round(subscription.price * (subscription.credits - subscription.used_credits) / subscription.credits * 100) / 100
      if (refund > 0.0) {
        const refundResult = await refundTransaction(tx.id, refund)
        if (refundResult.success) {
          actionMsg = 'A refund for $' + refund + ' has been issued to ' + subscription.payment_method_descr + '.'
        }
        else {
          throw new Error(refundResult.message)
        }

      }
    }

    //Refund proration if no void




    const result = checkResult(await cancelSubscription(subscription.id))


    //TODO update subscription
    await cancel(req.params.subscriptionId)
  } catch (e) {
    req.session.errorMessage = e.message
    res.redirect(req.originalUrl)
    return
  }
  req.session.successMessage = 'Your subscription has been canceled. ' + actionMsg
  res.redirect('/user/dashboard')
}

router.get('/:subscriptionId', asyncHandler(get))
router.post('/:subscriptionId', asyncHandler(post))
module.exports = router