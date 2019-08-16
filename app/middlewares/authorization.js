const { db, logger } = require('../services')
const { lookup } = require('../util')

module.exports = {
	requiresUser: (req, res, next) => {
		if (req.user) return next()
		req.session.redirectTo = req.url
		res.redirect('/user/signin');

	},

	requiresAdmin: (req, res, next) => {
		if (req.user && req.user.type === 'admin') return next()

		res.sendStatus(401)
	},
	requiresApiKey: async (req, res, next) => {

		const apiKeyField = 'apikey';
		const apiKeyHeader = 'apikey';
		var apikey = lookup(req.body, apiKeyField)
			|| lookup(req.query, apiKeyField)
			|| lookup(req.headers, apiKeyHeader);

		if (!apikey) {
			res.status(400).send("Missing API Key")
			return
		}
		const result = await db.any('SELECT id FROM apikey WHERE value=$1', [apikey])
		if (result.length != 1) {
			res.status(400).send("Invalid API Key")
			return
		}
		return next()

	}
}
