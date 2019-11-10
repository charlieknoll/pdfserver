const { db } = require('../../services')
const asyncHandler = require('express-async-handler')
const viewPath = require('../../middlewares/viewPath')
const router = require('express').Router().use(viewPath)
const config = require('../../config')
const braintree = require('braintree');
const { promisify } = require('util')
const { createSubscription } = require('../../services/subscription')


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
  //TODO get token, see if it has 3d info from braintree
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

const post = async function (req, res, next) {
  const gateway = braintree.connect(config.braintree);

  const createSubscriptionAsync = promisify(gateway.subscription.create).bind(gateway.subscription)
  const params = {
    paymentMethodToken: req.session.paymentMethodToken,
    planId: req.session.selectedPlan.id,
    name: req.user.name

  }
  if (req.session.paymentType == 'PayPalAccount') {
    params.options = {
      paypal: {
        description: 'Responsive Paper ' + req.session.selectedPlan.name + ' plan monthly subscription'
      }
    }
  }
  const result = await createSubscriptionAsync(params)

  if (!result.success) {
    req.session.errorMessage = "An error occurred processing the transaction, please try again."
    res.redirect(req.baseUrl)
    return
  }
  await createSubscription(req.user.id, req.session.selectedPlan.id, null, result.subscription.id)
  //TODO insert subscription and apikey

  res.redirect('/user/payment-confirmed')
}

router.get('/', asyncHandler(get))
router.post('/', asyncHandler(post))
module.exports = router