const { db } = require('../../services')
const asyncHandler = require('express-async-handler')
const viewPath = require('../../middlewares/viewPath')
const router = require('express').Router().use(viewPath)
const config = require('../../config')
const braintree = require('braintree');



const get = async function (req, res, next) {
  //TODO get token, see if it has 3d info from braintree
  // gateway.paymentMethodNonce.create("A_PAYMENT_METHOD_TOKEN", function (err, response) {
  //   var nonce = response.paymentMethodNonce.nonce;
  // });
  const errorMessage = req.session.errorMessage
  delete req.session.errorMessage

  res.render(req.viewPath, {
    name: req.user.display_name,
    title: "Billing Info", errorMessage,
    plan: req.session.selectedPlan,
  })

}

router.get('/', asyncHandler(get))
//router.post('/', asyncHandler(post))
module.exports = router