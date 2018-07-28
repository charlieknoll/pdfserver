const url = '/user/dashboard'
const auth = require('../../middlewares/authorization')

const get = function (req, res, next) {
    const successMessage = req.session.successMessage
    delete req.session.successMessage
    res.render(url.substring(1), { name: req.user.displayname, title: "Dashboard", successMessage })
}

module.exports = function (app) {
    app.get(url, auth.requiresUser, get)
}