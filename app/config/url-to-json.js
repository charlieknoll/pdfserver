const cors = require('cors')
const asyncHandler = require('express-async-handler')
const router = require('express').Router()
const getPageObject = require('../services/getPageObject')

router.use('/', cors(), asyncHandler(async function (req, res, next) {
  try {
    const params = Object.assign({}, req.body, req.query)
    const result = await getPageObject({
      value: params.value,
      o: params.o
    })
    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify(result))
    return

  } catch {
    res.sendStatus(500)
  }
}))
module.exports = router