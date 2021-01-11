const { db } = require('../../services')
const asyncHandler = require('express-async-handler')
const viewPath = require('../../middlewares/viewPath')
const router = require('express').Router().use(viewPath)
const config = require('../../config')
const braintree = require('braintree');
const { promisify } = require('util')


const get = async function (req, res, next) {
  const errorMessage = req.session.errorMessage
  delete req.session.errorMessage
  const gateway = new braintree.BraintreeGateway(config.braintree)
  const findCustomer = promisify(gateway.customer.find).bind(gateway.customer)
  const generateClientToken = promisify(gateway.clientToken.generate).bind(gateway.clientToken)

  let findResult
  try {
    findResult = await findCustomer(req.user.id)
  } catch (e) { }

  const tokenOptions = findResult ? { customerId: req.user.id } : {}

  const result = await generateClientToken(tokenOptions)

  res.render(req.viewPath, {
    name: req.user.display_name,
    email: req.user.email,
    title: "Select Payment Method", errorMessage,
    plan: req.session.selectedPlan,
    clientToken: result.clientToken
  })
}

const post = async function (req, res, next) {
  const payload = JSON.parse(req.body.payload)
  req.session.nonce = payload.nonce
  req.session.deviceData = payload.deviceData
  req.session.paymentType = payload.type
  req.session.paymentMethodDescr = payload.type == 'CreditCard' ? payload.details.cardType + ' card ending with ' + payload.details.lastFour : payload.details.email + ' PayPal Account'
  req.session.expiration = payload.type == 'CreditCard' ? payload.details.expirationMonth + '/' + payload.details.expirationYear.substring(2) : null
  res.redirect('/user/confirm-subscription')
}

router.get('/', asyncHandler(get))
router.post('/', asyncHandler(post))
module.exports = router