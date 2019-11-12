const { db } = require('../services')
const speakeasy = require('speakeasy')

const checkApiKeyOwner = async function (user_id, id) {
  const sql = `
SELECT        apikey.id, subscription.user_id
FROM            subscription INNER JOIN
                         apikey ON subscription.id = apikey.subscription_id
WHERE subscription.user_id = ${user_id} and apikey.id = ${id}
  `
  await db.one(sql)
}
const checkSubscriptionOwner = async function (user_id, id) {
  const sql = `
SELECT        subscription.user_id
FROM            subscription
WHERE subscription.user_id = ${user_id} and subscription.id = ${id}
  `
  await db.one(sql)
}

const create = async function (subscription_id, user_id, name) {
  await checkSubscriptionOwner(user_id, subscription_id)
  const apikey = speakeasy.generateSecretASCII()

  const apiSql = `
        INSERT INTO apikey (subscription_id, value, descr, revoked) VALUES (${subscription_id},'${apikey}', $1, false)
        `
  await db.none(apiSql, [name])
}
const revoke = async function (user_id, id) {
  checkApiKeyOwner(user_id, id)
  const apiSql = `
        UPDATE apikey SET revoked = true where id = ${id}
        `
  await db.none(apiSql)

}
const rename = async function (id, user_id, name) {
  checkApiKeyOwner(user_id, id)
  const apiSql = `
        UPDATE apikey SET name = ${name} where id = ${id}
        `
  await db.none(apiSql)

}
