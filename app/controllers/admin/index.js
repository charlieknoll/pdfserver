const express = require('express')
const router = express.Router()
const { requiresAdmin } = require('../../middlewares/authorization')
const dashboard = require('./dashboard')
const asyncHandler = require('express-async-handler')
router.use(asyncHandler(requiresAdmin))


dashboard(router)

module.exports = router