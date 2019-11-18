const { db, redis } = require('../services')
const { lookup } = require('../util')

module.exports = {
	requiresUser: async (req, res, next) => {
		if (req.user) return next()
		if (req.query.authToken) {
			const id = await redis.get(req.query.authToken)
			const results = await db.query('SELECT id, email, display_name, user_type, MD5(email) email_hash FROM users WHERE users.id = $1', [parseInt(id, 10)])
			if (results.length == 0) cb(null, null)
			const apikeys = await db.query(`
SELECT apikey.value, apikey.descr
FROM subscription INNER JOIN
apikey ON subscription.id = apikey.subscription_id
WHERE subscription.user_id = $1 and apikey.revoked = false
            `, [parseInt(id, 10)])
			results[0].apikeys = apikeys
			req.user = results[0]
			return next()
		}
		req.session.redirectTo = req.originalUrl
		res.redirect('/user/signin');

	},

	requiresAdmin: (req, res, next) => {
		if (req.user && req.user.user_type === 'admin') return next()
		if (!req.user) {
			req.session.redirectTo = req.originalUrl
			res.redirect('/user/signin');
			return
		}

		res.sendStatus(401)
	},
	requiresApiKey: async (req, res, next) => {
		const apiKeyField = 'apikey';
		const apiKeyHeader = 'apikey';
		var apikey = lookup(req.body, apiKeyField)
			|| lookup(req.query, apiKeyField)
			|| lookup(req.headers, apiKeyHeader);

		if (!apikey) {
			res.setHeader('Content-Type', 'application/json');
			res.statusMessage = "Missing API Key"
			res.status(401).send({ "error": res.statusMessage })
			return
		}
		const result = await db.any(`
			SELECT
			 apikey_id,
			 apikey,
			 subscription_id,
			 rate_limit,
			 concurrent_limit,
			 overdrawn,
			 include_console
			FROM apikey_validation
			WHERE apikey = $1
			`, apikey)
		if (result.length != 1) {
			res.setHeader('Content-Type', 'application/json');
			res.statusMessage = "Invalid API Key"
			res.status(403).send({ "error": res.statusMessage })
			return
		}
		if (result[0].overdrawn) {
			res.setHeader('Content-Type', 'application/json');
			res.statusMessage = "Insufficient credit balance"
			res.status(402).send({ "error": res.statusMessage })
			return
		}
		req.rp = result[0]
		return next()
	}
}
