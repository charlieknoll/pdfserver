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

const insertPaymentMethod = async function (req, paymentMethod) {
  //TODO
  //INSERT payment_method(payment_type, bin, token, expire, last4, payload)
  req.session.payment_method_id = await db.one(`
    INSERT INTO payment_method(user_id,account_type,account_id,expiration_month,
      expiration_year,bin,card_type, last_four,token, info)
    VALUES($1,$2,$3,$4,$5,$6,$7, $8, $9,$10) RETURNING id
  `, [
    req.user.id,
    paymentMethod.cardType ? 'CreditCard' : 'PayPalAccount',
    paymentMethod.email,
    paymentMethod.expirationMonth,
    paymentMethod.expirationYear,
    paymentMethod.bin,
    paymentMethod.cardType,
    paymentMethod.last4,
    paymentMethod.token,
    req.body.payload
  ])
  return paymentMethod.cardType ? 'CreditCard' : 'PayPalAccount'
  //set paymentMethodId on session
}
const successRedirect = function (paymentMethodType, req, res) {
  //TODO redirect based on payment type
  if (paymentMethodType == 'CreditCard') {
    res.redirect('/user/billing-info')
    return
  }
  if (paymentMethodType == 'CreditCard') {
    res.redirect('/user/confirm-subscription')
    return
  }

  //Put data on session for use in the billing address and confirmation steps
}
const post = async function (req, res, next) {
  const gateway = braintree.connect(config.braintree);
  // Use the payment method nonce here
  const payload = JSON.parse(req.body.payload)

  if (req.user.vaulted) {
    //TODO

    if (payload.vaulted) {
      gateway.paymentMethod.create({
        customerId: req.user.id,
        paymentMethodNonce: payload.nonce,
        deviceData: payload.deviceData
      }, function (err, result) {
        console.log(result)


      });
      req.session.payment_method_id = await db.oneOrNone(`
      SELECT id FROM payment_method
      WHERE user_id = $1 AND expiration_month = $2 AND expiration_year = $3 AND last_four = $4
      `, [req.user.id, payload.details.expirationMonth,
      payload.details.expirationYear, payload.details.lastFour])
      //TODO if null then insert and set payment method

      //TODO Update billing address
      return successRedirect(payload.type, req, res)
    }
    else {
      gateway.paymentMethod.create({
        customerId: req.user.id,
        paymentMethodNonce: nonceFromTheClient,
        deviceData: payload.deviceData
      }, function (err, result) {
        console.log(result)


      });

    }

  }
  else {
    const options = {
      id: req.user.id,
      paymentMethodNonce: payload.nonce,
      deviceData: payload.deviceData
    }
    gateway.customer.create(options, async function (err, result) {
      //on err redirect back to /user/payment-method with warning-message
      if (err) {

        //TODO if customer exists (vault and db out of synch), then do gateway.paymentMethod.create
        req.session.errorMessage = err.message
        res.redirect(req.baseUrl)
        return
      }
      //TODO update user.vault_id
      await db.none(`UPDATE users SET vault_id = $1 WHERE id = $2`, [result.customer.id, req.user.id])

      const accountType = await insertPaymentMethod(req, result.customer.paymentMethods[0])

      successRedirect(accountType, req, res)

    });

  }
}
router.get('/', asyncHandler(get))
router.post('/', asyncHandler(post))
module.exports = router