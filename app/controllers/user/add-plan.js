const { db } = require('../../services')
const asyncHandler = require('express-async-handler')
const viewPath = require('../../middlewares/viewPath')
const router = require('express').Router().use(viewPath)

const actionVm = function (req, errors) {
  delete req.session.successMessage
  return {

    title: 'Add Plan',
    errors: (errors || []).map(e => e.msg),
    name: req.body.name,
    username: req.user.display_name,
    successMessage: req.session.successMessage
  }
}

const get = async function (req, res, next) {
  const plans = await db.any(`
--
SELECT        name, price, credits, rate_limit, concurrent_limit, active
FROM            pricing_plan
WHERE id <> 1 and Active = true
                         `)

  res.render(req.viewPath, actionVm(req))
}

const post = async function (req, res, next) {
  //verify plan id
  const plan = await db.oneOrNone(`
  SELECT        id, name, price
  FROM            pricing_plan
  WHERE id <> 1 and Active = true and id = $1
`, req.body.planId)

  if (!plan) return res.render(req.viewPath, actionVm(req, [{ msg: "Invalid plan selected" }]))
  //TODO set planId on session
  req.session.selectedPlan = plan


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