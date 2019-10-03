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
			res.setHeader('Content-Type', 'application/json');
			res.statusMessage = "Missing API Key"
			res.status(401).send({ "error": res.statusMessage })
			return
		}
		const result = await db.any('SELECT id FROM apikey WHERE value=$1', [apikey])
		if (result.length != 1) {
			res.setHeader('Content-Type', 'application/json');
			res.statusMessage = "Invalid API Key"
			res.status(403).send({ "error": res.statusMessage })
			return
		}
		return next()
	}
}
