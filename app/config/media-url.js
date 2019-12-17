const cors = require('cors')
const asyncHandler = require('express-async-handler')
const router = require('express').Router()
const axios = require('axios')

router.use('/', cors(), asyncHandler(async function (req, res, next) {
  params = {
    league: 'nhl',
    date: req.query.date,
    id: req.query.id,
    cdn: 'akc'
  }
  const url = 'http://nhl.freegamez.ga/getM3U8.php?' + new URLSearchParams(params).toString()
  const result = await axios({ url, method: 'GET' })
  if (result.status = 200) {
    res.send(result.data)
    return
  }
  res.sendStatus(res.status)
}))
module.exports = router