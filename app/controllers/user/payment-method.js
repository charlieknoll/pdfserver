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
  const gateway = braintree.connect(config.braintree);
  const findCustomer = promisify(gateway.customer.find).bind(gateway.customer)
  const generateClientToken = promisify(gateway.clientToken.generate).bind(gateway.clientToken)

  //ensure customer id has been vaulted
  //const customerResult = await createCustomer({ id: req.user.id })
  //const customerResult = await createCustomer({ id: req.user.id })
  //if user is gateway user pass customer id in options

  let findResult
  try {
    findResult = await findCustomer(req.user.id)
  } catch (e) {
    //console.log(e)
  }

  const tokenOptions = findResult ? { customerId: req.user.id } : {}
  tokenOptions.version = '3'
  const result = await generateClientToken(tokenOptions)
  if (!findResult) result.clientToken = 'sandbox_24dmtsx6_hpbdxsbzdtpk6hf6'
  res.render(req.viewPath, {
    name: req.user.display_name,
    title: "Select Payment Method", errorMessage,
    plan: req.session.selectedPlan,
    //clientToken: 'sandbox_24dmtsx6_hpbdxsbzdtpk6hf6'
    clientToken: result.clientToken
  })
}

const post = async function (req, res, next) {
  const gateway = braintree.connect(config.braintree);
  const payload = JSON.parse(req.body.payload)
  const findCustomer = promisify(gateway.customer.find).bind(gateway.customer)
  const createCustomer = promisify(gateway.customer.create).bind(gateway.customer)
  let findResult
  let paymentMethodResult

  try {
    findResult = await findCustomer(req.user.id)

    const createPaymentMethod = promisify(gateway.paymentMethod.create).bind(gateway.paymentMethod)

    paymentMethodResult = await createPaymentMethod({
      customerId: req.user.id,
      paymentMethodNonce: payload.nonce,
      deviceData: payload.deviceData
    })
    req.session.paymentMethodToken = paymentMethodResult.paymentMethod.token
  } catch (e) {
    const customerResult = await createCustomer({
      id: req.user.id,
      paymentMethodNonce: payload.nonce,
      deviceData: payload.deviceData
    })
    req.session.paymentMethodToken = customerResult.customer.paymentMethods[0].token
  }



  //req.session.nonce = payload.nonce

  req.session.paymentType = payload.type
  req.session.paymentMethodDescr = payload.type == 'CreditCard' ? payload.details.cardType + ' card ending with ' + payload.details.lastFour : 'PayPal account'
  //TODO put payment description in the session

  res.redirect('/user/confirm-subscription')
}

router.get('/', asyncHandler(get))
router.post('/', asyncHandler(post))
module.exports = router