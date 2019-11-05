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
  const createCustomer = promisify(gateway.customer.create).bind(gateway.customer)
  const generateClientToken = promisify(gateway.clientToken.generate).bind(gateway.clientToken)

  //ensure customer id has been vaulted
  await createCustomer({ id: req.user.id })
  //if user is gateway user pass customer id in options

  const result = await generateClientToken({ customerId: req.user.id })
  res.render(req.viewPath, {
    name: req.user.display_name,
    title: "Select Payment Method", errorMessage,
    plan: req.session.selectedPlan,
    clientToken: result.clientToken
  })
}

const post = async function (req, res, next) {
  const gateway = braintree.connect(config.braintree);
  const payload = JSON.parse(req.body.payload)
  req.session.nonce = payload.nonce
  //TODO put payment description in the session

  res.redirect('/user/confirm-subscription')
}

router.get('/', asyncHandler(get))
router.post('/', asyncHandler(post))
module.exports = router