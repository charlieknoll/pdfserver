const { db } = require('../../services')
const asyncHandler = require('express-async-handler')
const viewPath = require('../../middlewares/viewPath')
const router = require('express').Router().use(viewPath)
const config = require('../../config')
const braintree = require('braintree');



const get = async function (req, res, next) {
  //TODO get token, see if it has 3d info from braintree
  const errorMessage = req.session.errorMessage
  delete req.session.errorMessage

  res.render(req.viewPath, {
    name: req.user.display_name,
    title: "Confirm Subscription", errorMessage,
    plan: req.session.selectedPlan,
  })

}
//TODO add THANK YOU message to response

router.get('/', asyncHandler(get))
//router.post('/', asyncHandler(post))
module.exports = router