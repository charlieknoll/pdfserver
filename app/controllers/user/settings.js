const { validationResult, body } = require('express-validator');
const { sanitizeBody } = require('express-validator');
const viewPath = require('../../middlewares/viewPath')
const router = require('express').Router().use(viewPath)
const asyncHandler = require('express-async-handler')
const apikey = require('../../models/apikey')

const get = async function (req, res, next) {

  res.render(req.viewPath, { title: 'Settings' })
}
router.get('/', asyncHandler(get))

module.exports = router