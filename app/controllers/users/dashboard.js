const url = '/user/dashboard'
const auth = require('../../middlewares/authorization')

const get = function (req, res, next) {
    res.render(url.substring(1), { name: req.user.displayname, title: "Dashboard" })
}

module.exports = function (app) {
    app.get(url, auth.requiresUser, get)
}