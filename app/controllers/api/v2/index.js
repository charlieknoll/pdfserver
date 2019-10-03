const express = require('express')
const router = express.Router()
const { requiresApiKey } = require('../../../middlewares/authorization')
const asyncHandler = require('express-async-handler')

router.use(asyncHandler(requiresApiKey))

// define the home page route
router.get('/', function (req, res) {
  res.send('Birds home page')
})
// define the about route
router.get('/about', function (req, res) {
  res.send('About birds')
})

module.exports = router