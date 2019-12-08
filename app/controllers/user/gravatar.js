const asyncHandler = require('express-async-handler')
const router = require('express').Router()
const { db } = require('../../services')

const get = async function (req, res, next) {
  const result = await db.one(`SELECT image from Users
WHERE id = $1
  `, req.user.id)
  const image = Buffer.from(result.image, 'hex')
  res.set('Content-Type', 'image/jpeg')
  res.set('Cache-Control', 'max-age=31536000');
  res.set('x-timestamp', Date.now())
  res.send(image)

}

router.get('/', asyncHandler(get))

module.exports = router