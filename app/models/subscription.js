const { db } = require('../services')
const speakeasy = require('speakeasy')

const createSubscription = async function (userId, planId, apiKeyDescr, paymentMethodDescr, expiration) {

  const subSql = `
        INSERT INTO subscription(user_id, pricing_plan_id, start_date, next_charge_date, used_credits, credits, rate_limit,
          concurrent_limit,  payment_method_descr, expiration, status)
        SELECT ${userId},pricing_plan.id, CURRENT_DATE, CURRENT_DATE + INTERVAL '1 month', 0, pricing_plan.credits,pricing_plan.rate_limit,
          pricing_plan.concurrent_limit, '${paymentMethodDescr}', '${expiration}', 'Active'
        FROM pricing_plan
        WHERE pricing_plan.id = ${planId} RETURNING id`
  const subResult = await db.one(subSql)

  const apikey = speakeasy.generateSecretASCII()

  const apiSql = `
        INSERT INTO apikey (subscription_id, value, descr, revoked) VALUES (${subResult.id},'${apikey}', $1, false)
        `
  await db.none(apiSql, [apiKeyDescr])
  return subResult.id

}
const updatePaymentMethod = async function (id, paymentMethodDescr, expiration) {
  const updateSql = `
  update subscription set
    payment_method_descr = '${paymentMethodDescr}',
    expiration = '${expiration}',
    status = 'Active'
  WHERE id = ${id}
  `
  await db.none(updateSql)
}
const cancel = async function (id) {
  const sql = `
    UPDATE subscription set cancel_date = CURRENT_DATE, status = 'Canceled'
    where id = ${id}
  `
  await db.none(sql)
}
const deleteFailed = async function (id) {
  const sql = `
delete from request_log where apikey_id in (select id from apikey where subscription_id in (select id from subscription where id = ${id}));
delete from apikey where subscription_id in (select id from subscription where id = ${id});
delete from subscription where id = ${id};
  `
  await db.none(sql)
}
const logEvent = async function (id, kind, event_timestamp, nextBillingDate) {
  const sql = `
    INSERT INTO subscription_log(subscription_id,kind,event_timestamp)
    VALUES(${id},'${kind}','${event_timestamp}')
  `
  db.none(sql)
  let status
  if (kind === 'subscription_went_past_due') {
    status = 'Past Due'
  }
  if (kind === 'subscription_canceled') {
    status = 'Canceled'
  }
  if (kind === 'subscription_charged_successfully') {
    status = 'Active'
  }
  if (kind === 'subscription_expired') {
    status = 'Expired'
  }
  const updateSql = `
    UPDATE subscription SET
      status = '${status}',
      next_charge_date = '${nextBillingDate}',
      cancel_date = case when '${status}' = 'Expired' OR (cancel_date is null AND '${status}' = 'Canceled') then CURRENT_DATE when '${status}' = 'Active' then null else cancel_date end
    WHERE id = ${id}
  `
  db.none(updateSql)
  //TODO send past due notification
}
module.exports = {
  createSubscription,
  updatePaymentMethod,
  cancel,
  deleteFailed,
  logEvent
}