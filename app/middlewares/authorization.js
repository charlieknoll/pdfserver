module.exports = {
	requiresLogin: (req, res, next) => {
		if (req.user) return next()
		req.session.redirectTo = req.url
		res.redirect('/auth/login');

	},

	requiresAdmin: (req, res, next) => {
		if (req.user && req.user.type === 'admin') return next()

		res.sendStatus(401)
	}
}
