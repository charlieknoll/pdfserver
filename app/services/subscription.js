const { db } = require('./')
const speakeasy = require('speakeasy')

const createSubscription = async function (userId, planId, apiKeyDescr, gatewayId) {

  const subSql = `
        INSERT INTO subscription(user_id, pricing_plan_id, start_date, used_credits, credits, rate_limit, concurrent_limit, gateway_id)
        SELECT ${userId},pricing_plan.id, CURRENT_DATE, 0, pricing_plan.credits,pricing_plan.rate_limit, pricing_plan.concurrent_limit, '${gatewayId}'
        FROM pricing_plan
        WHERE pricing_plan.id = ${planId} RETURNING id`
  const subResult = await db.one(subSql)

  const apikey = speakeasy.generateSecretASCII()

  const apiSql = `
        INSERT INTO apikey (subscription_id, value, descr, revoked) VALUES (${subResult.id},'${apikey}', $1, false)
        `
  await db.none(apiSql, [apiKeyDescr])

}
module.exports = {
  createSubscription
}