const url = '/user/dashboard'
const auth = require('../../middlewares/authorization')
const { db, logger } = require('../../services')
const asyncHandler = require('express-async-handler')
const config = require('../../config')


const get = async function (req, res, next) {
    const successMessage = req.session.successMessage
    delete req.session.successMessage
    const subscriptions = await db.any(`
--
SELECT subscription.id
	,pricing_plan.name
	,subscription.start_date
	,subscription.cancel_date
	,subscription.next_charge_date
	,subscription.used_credits
	,subscription.credits
	,subscription.rate_limit
	,subscription.concurrent_limit
FROM subscription
INNER JOIN pricing_plan ON subscription.pricing_plan_id = pricing_plan.id
WHERE subscription.user_id = ${req.user.id}
                         `)
    const apikeys = await db.any(`
SELECT        apikey.value, apikey.descr, apikey.revoked, apikey.subscription_id
FROM            apikey INNER JOIN
                         subscription ON apikey.subscription_id = subscription.id
WHERE subscription.user_id = $1
    `, req.user.id)

    //var test = subscriptions.map(s => { s.apikeys = apikeys.filter(a => a.subscription_id == s.id); return s; })
    res.render(url.substring(1), {
        name: req.user.display_name,
        subscriptions: subscriptions.map(s => { s.apikeys = apikeys.filter(a => a.subscription_id == s.id); return s; }),
        title: "Dashboard", successMessage
    })
}

module.exports = function (app) {
    app.get(url, auth.requiresUser, asyncHandler(get))
}