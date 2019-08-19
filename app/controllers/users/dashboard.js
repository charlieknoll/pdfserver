const url = '/user/dashboard'
const auth = require('../../middlewares/authorization')
const { db, logger } = require('../../services')
const asyncHandler = require('express-async-handler')


const get = async function (req, res, next) {
    const successMessage = req.session.successMessage
    delete req.session.successMessage
    const result = await db.any('Select value, usedcredits from apikey where userid = ${userid}', { userid: req.user.id })
    res.render(url.substring(1), { name: req.user.displayname, apikey: result[0].value, usedCredits: result[0].usedcredits, title: "Dashboard", successMessage })
}

module.exports = function (app) {
    app.get(url, auth.requiresUser, asyncHandler(get))
}