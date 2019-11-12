const express = require('express')
const router = express.Router()
//const { requiresAdmin } = require('../../middlewares/authorization')

//const asyncHandler = require('express-async-handler')
//router.use(asyncHandler(requiresAdmin))
router.use('/braintree', require('./braintree'))
module.exports = router