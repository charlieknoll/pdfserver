const { validationResult, body } = require('express-validator');
const { sanitizeBody } = require('express-validator');
const viewPath = require('../../middlewares/viewPath')
const router = require('express').Router().use(viewPath)
const asyncHandler = require('express-async-handler')

const { db } = require('../../services')

const get = async function (req, res, next) {
  const result = await db.manyOrNone(`
  SELECT apikey.value as api_key_value, apikey.descr as api_key_descr,
  ((request_log.file_size/1000000)::int)+1 as credits, request_log.file_size,
  TO_CHAR(request_log.request_time, 'DD-MM-YY HH24:MI:SS') as request_time,
  request_log.value, request_log.ip_address, request_log.delay,
  request_log.duration, request_log.status, request_log.network_data,
                         request_log.cached_data, request_log.from_cache_data, request_log.file_size
FROM            subscription INNER JOIN
                         apikey ON subscription.id = apikey.subscription_id INNER JOIN
                         request_log ON apikey.id = request_log.apikey_id
WHERE subscription.user_id = $1
ORDER By request_log.id DESC LIMIT 100
  `, req.user.id)

  res.render(req.viewPath, {
    title: 'Usage',
    requests: result,
    usage: 'active'
  })
}

router.get('/', asyncHandler(get))

module.exports = router