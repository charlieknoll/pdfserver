const { db } = require('../../services')
const asyncHandler = require('express-async-handler')
const viewPath = require('../../middlewares/viewPath')
const router = require('express').Router().use(viewPath)


const get = async function (req, res, next) {
  res.render(req.viewPath, {
    name: req.user.display_name,
    title: "Payment Confirmed",
    plan: req.session.selectedPlan
  })
}


router.get('/', asyncHandler(get))
module.exports = router