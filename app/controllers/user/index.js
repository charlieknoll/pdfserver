const router = require('express').Router()
const auth = require('../../middlewares/authorization')
const { signInLimiter } = require('../../services/rateLimiter')

router.use('/dashboard', auth.requiresUser, require('./dashboard'))
router.use('/signIn', signInLimiter, require('./signIn'))
router.use('/signOut', auth.requiresUser, require('./signOut'))
router.use('/register', signInLimiter, require('./register'))
router.use('/reset-password', signInLimiter, require('./resetPassword'))
router.get('/reset-pending', (req, res) => res.render('user/reset-pending', { title: 'Password Reset Pending' }))
router.use('/change-password', signInLimiter, require('./changePassword'))
router.use('/subscribe', auth.requiresUser, require('./subscribe'))
router.use('/checkout', auth.requiresUser, require('./checkout'))
router.use('/add-plan', auth.requiresUser, require('./add-plan'))
router.use('/payment-method', auth.requiresUser, require('./payment-method'))
router.use('/billing-info', auth.requiresUser, require('./billing-info'))
router.use('/confirm-subscription', auth.requiresUser, require('./confirm-subscription'))

module.exports = router

