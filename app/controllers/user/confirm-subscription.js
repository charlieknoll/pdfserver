const { db } = require('../../services')
const asyncHandler = require('express-async-handler')
const viewPath = require('../../middlewares/viewPath')
const router = require('express').Router().use(viewPath)
const config = require('../../config')
const braintree = require('braintree');
const { promisify } = require('util')
const { createSubscription, deleteFailed } = require('../../models/subscription')


function ordinal_suffix_of(i) {
  var j = i % 10,
    k = i % 100;
  if (j == 1 && k != 11) {
    return i + "st";
  }
  if (j == 2 && k != 12) {
    return i + "nd";
  }
  if (j == 3 && k != 13) {
    return i + "rd";
  }
  return i + "th";
}
const get = async function (req, res, next) {
  if (!req.session.nonce) {
    res.redirect('/user/dashboard')
    return
  }
  const errorMessage = req.session.errorMessage
  delete req.session.errorMessage
  res.render(req.viewPath, {
    name: req.user.display_name,
    title: "Confirm Subscription", errorMessage,
    plan: req.session.selectedPlan,
    paymentMethodDescr: req.session.paymentMethodDescr,
    recurDateDescr: ordinal_suffix_of(new Date().getDate())
  })
}

const checkResult = function (o) {
  if (!o.success) throw new Error(o.message)
  return o
}


const post = async function (req, res, next) {

  const gateway = braintree.connect(config.braintree);
  const findCustomer = promisify(gateway.customer.find).bind(gateway.customer)
  const createCustomer = promisify(gateway.customer.create).bind(gateway.customer)
  const createSubscriptionAsync = promisify(gateway.subscription.create).bind(gateway.subscription)
  let paymentMethodToken
  let findResult
  let subscriptionId
  try {
    findResult = await findCustomer(req.user.id)
  } catch (e) {
  }
  try {
    if (findResult) {
      const createPaymentMethod = promisify(gateway.paymentMethod.create).bind(gateway.paymentMethod)

      const paymentMethodResult = checkResult(await createPaymentMethod({
        customerId: req.user.id,
        paymentMethodNonce: req.session.nonce,
        deviceData: req.session.deviceData
      }))
      paymentMethodToken = paymentMethodResult.paymentMethod.token
    } else {
      const names = req.user.display_name.replace('  ', ' ').split(' ')
      const firstName = names[0]
      const lastName = names.length > 1 ? names[1] : null
      const customerResult = checkResult(await createCustomer({
        id: req.user.id,
        firstName,
        lastName,
        paymentMethodNonce: req.session.nonce,
        deviceData: req.session.deviceData
      }))
      paymentMethodToken = customerResult.customer.paymentMethods[0].token

    }
    req.session.nonce = null
    const params = {
      paymentMethodToken: paymentMethodToken,
      planId: req.session.selectedPlan.id
    }
    if (req.session.paymentType == 'PayPalAccount') {
      params.options = {
        paypal: {
          description: 'Responsive Paper ' + req.session.selectedPlan.name + ' plan monthly subscription'
        }
      }
    }
    subscriptionId = await createSubscription(
      req.user.id,
      req.session.selectedPlan.id,
      req.session.selectedPlan.name + ' API Key',
      req.session.paymentMethodDescr,
      req.session.expiration)

    params.id = subscriptionId
    const result = checkResult(await createSubscriptionAsync(params))
  } catch (e) {
    if (subscriptionId) {
      try {
        deleteFailed(subscriptionId)
      } catch { }
    }
    req.session.errorMessage = e.message
    res.redirect('/user/payment-method')
    return
  }
  res.redirect('/user/payment-confirmed')
}

router.get('/', asyncHandler(get))
router.post('/', asyncHandler(post))
module.exports = router