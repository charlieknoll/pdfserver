const { db } = require('../services')
async function save(o, req) {
  if (!o.requestLog) return
  let err
  //save request log
  await db.tx('post-logs-tx', t => {
    // t.ctx = transaction context object
    let value = req.method == 'GET' ? req.query.value : req.body.value
    value = (value.substring(0, 4).toLowerCase() === 'http') ? value.split('?')[0] : 'html'
    const status = (o.message && o.message.includes('timeout')) ? 500 : 200



    return t.one(`
    INSERT INTO request_log(apikey_id, value, ip_address, delay, duration, status, request_time, network_data, cached_data,from_cache_data, file_size)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING id
    `, [req.rp.apikey_id, value,
    req.ip, o.requestLog.delay, o.requestLog.duration(), status, o.requestLog.request_time,
    o.requestLog.network_data, o.requestLog.cached_data,
    o.requestLog.from_cache_data, o.requestLog.file_size])

      .then(rLog => {
        const inserts = o.cacheLogs.map(c => {
          return t.none(`INSERT INTO cache_log(request_log_id, request_type, cache_key, expires, size)
             VALUES($1, $2, $3, $4, $5)`, [rLog.id, c.request_type, c.cache_key, c.expires, c.size])
        })
        return t.batch(inserts)
      })
      .then((data) => {
        const usedCredits = Math.floor(o.requestLog.file_size / 1000000) + 1
        t.none(`UPDATE subscription SET used_credits = used_credits + $1 WHERE id = (SELECT subscription_id FROM apikey WHERE id = $2)


    `, [usedCredits, req.rp.apikey_id])

      })
  })



  //save cache log
  //update usage

}
module.exports = {
  save
}