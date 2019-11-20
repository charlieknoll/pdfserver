const viewPath = require('../../middlewares/viewPath')
const router = require('express').Router().use(viewPath)
const asyncHandler = require('express-async-handler')
const { redis, db } = require('../../services')

const get = async function (req, res, next) {
  const successMessage = req.session.successMessage
  delete req.session.successMessage

  const result = await db.manyOrNone(`
SELECT subscription.id
FROM subscription
WHERE subscription.user_id = $1
`, req.user.id)
  let concurrentCt = 0
  if (result.length > 0) {
    for (var i = 0; i < result.length; i++) {
      const clc = await redis.get('rlc' + result[i].id)
      if (clc) concurrentCt += parseInt(clc, 10)
    }
  }

  res.render(req.viewPath, { title: 'Settings', successMessage, concurrentCt, settings: 'active' })
}
const reset = async function (req, res, next) {
  const result = await db.manyOrNone(`
SELECT subscription.id
FROM subscription
WHERE subscription.user_id = $1
`, req.user.id)
  if (result.length > 0) {
    for (var i = 0; i < result.length; i++) {
      await redis.del('rlc' + result[i].id)
    }
  }
  req.session.successMessage = 'Your concurrency count has been reset.'
  res.redirect('/user/settings')
}
router.get('/', asyncHandler(get))
router.post('/reset', asyncHandler(reset))
module.exports = router