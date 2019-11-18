const router = require('express').Router()
const auth = require('../../middlewares/authorization')
const { signInLimiter } = require('../../services/rateLimiter')
router.use('/*', function (req, res, next) {
  req.app.locals.layout = 'user-admin'; // set your layout here
  next(); // pass control to the next handler
});
router.use('/dashboard', auth.requiresUser, require('./dashboard'))
router.use('/signIn', signInLimiter, require('./signin'))
router.use('/signOut', auth.requiresUser, require('./signout'))
router.use('/register', signInLimiter, require('./register'))
router.use('/reset-password', signInLimiter, require('./reset-password'))
router.get('/reset-pending', (req, res) => res.render('user/reset-pending', { title: 'Password Reset Pending', layout: 'user-guest' }))
router.use('/change-password', signInLimiter, require('./change-password'))
router.use('/add-plan', auth.requiresUser, require('./add-plan'))
router.use('/payment-method', auth.requiresUser, require('./payment-method'))
router.use('/billing-info', auth.requiresUser, require('./billing-info'))
router.use('/confirm-subscription', auth.requiresUser, require('./confirm-subscription'))
router.use('/payment-confirmed', auth.requiresUser, require('./payment-confirmed'))
router.use('/update-payment', auth.requiresUser, require('./update-payment'))
router.use('/cancel-subscription', auth.requiresUser, require('./cancel-subscription'))
router.use('/edit-apikey', auth.requiresUser, require('./edit-apikey'))
router.use('/settings', auth.requiresUser, require('./settings'))
router.use('/usage', auth.requiresUser, require('./usage'))
// router.use('/billing', auth.requiresUser, require('./billing'))
module.exports = router

