const router = require('express').Router()
const auth = require('../../middlewares/authorization')
const { signInLimiter } = require('../../services/rateLimiter')
const asyncHandler = require('express-async-handler')
const pdfHandler = require('../../middlewares/pdfHandler')

router.use('/*', function (req, res, next) {
  req.app.locals.layout = 'user-admin'; // set your layout here
  next(); // pass control to the next handler
});
router.use('/dashboard', asyncHandler(auth.requiresUser), require('./dashboard'))
router.use('/signIn', signInLimiter, require('./signin'))
router.use('/signOut', asyncHandler(auth.requiresUser), require('./signout'))
router.use('/register', signInLimiter, require('./register'))
router.use('/reset-password', signInLimiter, require('./reset-password'))
router.get('/reset-pending', (req, res) => res.render('user/reset-pending', { title: 'Password Reset Pending', layout: 'user-guest' }))
router.use('/change-password', signInLimiter, require('./change-password'))
router.use('/add-plan', asyncHandler(auth.requiresUser), require('./add-plan'))
router.use('/payment-method', asyncHandler(auth.requiresUser), require('./payment-method'))
router.use('/billing-info', asyncHandler(auth.requiresUser), require('./billing-info'))
router.use('/confirm-subscription', asyncHandler(auth.requiresUser), require('./confirm-subscription'))
router.use('/payment-confirmed', asyncHandler(auth.requiresUser), require('./payment-confirmed'))
router.use('/update-payment', asyncHandler(auth.requiresUser), require('./update-payment'))
router.use('/cancel-subscription', asyncHandler(auth.requiresUser), require('./cancel-subscription'))
router.use('/edit-apikey', asyncHandler(auth.requiresUser), require('./edit-apikey'))
router.use('/settings', asyncHandler(auth.requiresUser), require('./settings'))
router.use('/usage', asyncHandler(auth.requiresUser), asyncHandler(pdfHandler), require('./usage'))
router.use('/billing', asyncHandler(auth.requiresUser), asyncHandler(pdfHandler), require('./billing'))
module.exports = router

