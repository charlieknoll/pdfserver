module.exports = {
	requiresUser: (req, res, next) => {
		if (req.user) return next()
		req.session.redirectTo = req.url
		res.redirect('/user/login');

	},

	requiresAdmin: (req, res, next) => {
		if (req.user && req.user.type === 'admin') return next()

		res.sendStatus(401)
	}
}
