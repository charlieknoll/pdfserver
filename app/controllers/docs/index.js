const express = require('express')
const router = express.Router()

const get = function (req, res, next) {

  res.render('docs/docs');
}
router.get('/', get)

module.exports = router