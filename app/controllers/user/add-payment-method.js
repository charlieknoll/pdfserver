const { db } = require('../../services')
const asyncHandler = require('express-async-handler')
const viewPath = require('../../middlewares/viewPath')
const router = require('express').Router().use(viewPath)

const get = async function (req, res, next) {
  const successMessage = req.session.successMessage
  delete req.session.successMessage

  res.render(req.viewPath, {
    name: req.user.display_name,
    title: "Add Payment Method", successMessage,
    plan: req.session.selectedPlan
  })
}
const post = async function (req, res, next) {
  //if existing:
  gateway.paymentMethod.create({
    customerId: "12345",
    paymentMethodNonce: nonceFromTheClient
  }, function (err, result) { });
  //if not a gateway user:

  gateway.customer.create({
    firstName: "Charity",
    lastName: "Smith",
    paymentMethodNonce: nonceFromTheClient
  }, function (err, result) {
    result.success;
    // true

    result.customer.id;
    // e.g 160923

    result.customer.paymentMethods[0].token;
    // e.g f28wm
  });


  //     const paymentMethods = await db.any(`
  // --
  // SELECT        id
  // FROM            pricing_plan
  // WHERE id <> 1 and Active = true and id = $1
  //                          `, req.user.id)

  //if they have payment
  //redirect to confirm-payment-method
  //else
  //redirect to add-payment-method
  res.redirect('/user/add-payment-method')


}
router.get('/', asyncHandler(get))
router.post('/', asyncHandler(post))
module.exports = router