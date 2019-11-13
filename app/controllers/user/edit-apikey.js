const { validationResult, body } = require('express-validator');
const { sanitizeBody } = require('express-validator');
const viewPath = require('../../middlewares/viewPath')
const router = require('express').Router().use(viewPath)
const asyncHandler = require('express-async-handler')
const apikey = require('../../models/apikey')

const get = async function (req, res, next) {
  let model
  if (req.params.id > -1) {
    model = await apikey.find(req.params.id)
  }
  else {
    model = {
      subscriptionId: req.params.subscriptionId,

    }
  }
  res.render(req.viewPath, model)
}
const post = async function (req, res, next) {
  if (req.params.id != -1) {
    await apikey.rename(req.params.id, req.user.id, req.body.descr)
    req.session.successMessage = 'Your API Key was renamed.'
    res.redirect('/user/dashboard')
  }
  else {
    await apikey.create(req.params.subscriptionId, req.user.id, req.body.descr)
    req.session.successMessage = 'Your API Key was created.'
    res.redirect('/user/dashboard')
  }
}
const revoke = async function (req, res, next) {
  await apikey.revoke(req.user.id, req.params.id)
  req.session.successMessage = 'Your API Key was revoked.'
  res.redirect('/user/dashboard')
}
router.get('/revoke/:id', asyncHandler(revoke))
router.get('/:subscriptionId/:id', asyncHandler(get))
router.post('/:subscriptionId/:id', asyncHandler(post))

module.exports = router