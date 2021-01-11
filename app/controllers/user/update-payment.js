const { db } = require('../../services')
const asyncHandler = require('express-async-handler')
const viewPath = require('../../middlewares/viewPath')
const router = require('express').Router().use(viewPath)
const config = require('../../config')
const braintree = require('braintree');
const { promisify } = require('util')
const { updatePaymentMethod } = require('../../models/subscription')

const checkResult = function (o) {
  if (!o.success) throw new Error(o.message)
  return o
}
const get = async function (req, res, next) {
  const errorMessage = req.session.errorMessage
  delete req.session.errorMessage
  const gateway = new braintree.BraintreeGateway(config.braintree)
  const findCustomer = promisify(gateway.customer.find).bind(gateway.customer)
  const generateClientToken = promisify(gateway.clientToken.generate).bind(gateway.clientToken)
  const updateSubscription = promisify(gateway.subscription.update).bind(gateway.subscription)
  const retryCharge = promisify(gateway.subscription.retryCharge).bind(gateway.subscription)

  const plan = await db.one(`
SELECT        pricing_plan.name, pricing_plan.price, pricing_plan.price::numeric as num_price, pricing_plan.credits,
pricing_plan.rate_limit, pricing_plan.concurrent_limit, pricing_plan.active
FROM            pricing_plan INNER JOIN subscription ON pricing_plan.id = subscription.pricing_plan_id
and subscription.id = $1 and subscription.user_id = $2
WHERE pricing_plan.id <> 1
                         `, [req.params.subscriptionId, req.user.id])


  await findCustomer(req.user.id)

  const result = checkResult(await generateClientToken({ customerId: req.user.id }))

  res.render(req.viewPath, {
    name: req.user.display_name,
    email: req.user.email,
    title: "Update Payment Method", errorMessage,
    plan,
    clientToken: result.clientToken
  })

  //if (!findResult) result.clientToken = 'sandbox_24dmtsx6_hpbdxsbzdtpk6hf6'

}

const post = async function (req, res, next) {
  const gateway = new braintree.BraintreeGateway(config.braintree)
  const payload = JSON.parse(req.body.payload)
  const findCustomer = promisify(gateway.customer.find).bind(gateway.customer)
  const updateSubscription = promisify(gateway.subscription.update).bind(gateway.subscription)
  const retryCharge = promisify(gateway.subscription.retryCharge).bind(gateway.subscription)
  const createPaymentMethod = promisify(gateway.paymentMethod.create).bind(gateway.paymentMethod)
  try {
    const subscription = await db.one(`
    SELECT id, user_id, pricing_plan_id
      FROM public.subscription
    WHERE subscription.id = $1 and subscription.user_id = $2 and cancel_date is null
    `, [req.params.subscriptionId, req.user.id])

    await findCustomer(req.user.id)

    const paymentMethodResult = checkResult(await createPaymentMethod({
      customerId: req.user.id,
      paymentMethodNonce: payload.nonce,
      deviceData: payload.deviceData
    }))

    const result = checkResult(await updateSubscription(subscription.id, {
      paymentMethodToken: paymentMethodResult.paymentMethod.token,
    }))


    const retryResult = await retryCharge(subscription.id, null, true)
    await updatePaymentMethod(
      req.params.subscriptionId,
      payload.type == 'CreditCard' ? payload.details.cardType + ' card ending with ' + payload.details.lastFour : payload.details.email + ' PayPal Account',
      payload.type == 'CreditCard' ? payload.details.expirationMonth + '/' + payload.details.expirationYear.substring(2) : null)
  } catch (e) {
    req.session.errorMessage = e.message
    res.redirect(req.originalUrl)
    return
  }
  req.session.successMessage = 'Your payment method has been updated'
  res.redirect('/user/dashboard')
}

router.get('/:subscriptionId', asyncHandler(get))
router.post('/:subscriptionId', asyncHandler(post))
module.exports = router