const router = require('express').Router()
const auth = require('../../middlewares/authorization')
router.use('/*', function (req, res, next) {
  req.app.locals.layout = 'user-admin'; // set your layout here
  next(); // pass control to the next handler
});
router.use('/', require('./convert'))
module.exports = router