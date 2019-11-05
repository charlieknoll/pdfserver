const { db, logger } = require('../../services')
const viewPath = require('../../middlewares/viewPath')
const router = require('express').Router().use(viewPath)
const asyncHandler = require('express-async-handler')
const config = require('../../config')
const braintree = require('braintree');

const post = async function (req, res, next) {
  const gateway = braintree.connect(config.braintree);
  // Use the payment method nonce here
  const nonceFromTheClient = req.body.paymentMethodNonce;
  // Create a new transaction for $10
  var newTransaction = gateway.transaction.sale({
    amount: '10.00',
    paymentMethodNonce: nonceFromTheClient,
    options: {
      // This option requests the funds from the transaction
      // once it has been authorized successfully
      submitForSettlement: true
    }
  }, function (error, result) {
    if (result) {
      res.send(result);
    } else {
      res.status(500).send(error);
    }
  });
}

router.post('/', asyncHandler(post))
module.exports = router
