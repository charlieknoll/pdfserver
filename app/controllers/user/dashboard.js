const { db } = require('../../services')
const asyncHandler = require('express-async-handler')
const viewPath = require('../../middlewares/viewPath')
const router = require('express').Router().use(viewPath)

const get = async function (req, res, next) {
    const successMessage = req.session.successMessage
    delete req.session.successMessage
    const subscriptions = await db.any(`
--
SELECT subscription.id
    ,pricing_plan.name
    ,pricing_plan.price
    ,subscription.pricing_plan_id
	,subscription.start_date
	,subscription.cancel_date
	,TO_CHAR(subscription.next_charge_date, 'mm/dd/yy') next_charge_date
	,subscription.used_credits
	,subscription.credits
	,subscription.rate_limit
    ,subscription.concurrent_limit
    ,subscription.payment_method_descr
    ,subscription.expiration
    ,case when subscription.used_credits >= subscription.credits THEN 'No credits remaining' else subscription.status end
FROM subscription
INNER JOIN pricing_plan ON subscription.pricing_plan_id = pricing_plan.id
WHERE subscription.user_id = ${req.user.id}
ORDER BY subscription.cancel_date desc, subscription.start_date asc
                         `)
    const apikeys = await db.any(`
SELECT        apikey.value, apikey.descr, case when subscription.cancel_date is not null then true else apikey.revoked end as revoked, apikey.subscription_id
FROM            apikey INNER JOIN
                         subscription ON apikey.subscription_id = subscription.id
WHERE subscription.user_id = $1
    `, req.user.id)



    res.render(req.viewPath, {
        name: req.user.display_name,
        subscriptions: subscriptions.map(s => { s.apikeys = apikeys.filter(a => a.subscription_id == s.id); return s; }),
        title: "Dashboard", successMessage
    })
}
router.get('/', asyncHandler(get))
module.exports = router