const dashboard = require('./dashboard')
const signin = require('./signin')
const signout = require('./signout')
const signup = require('./signup')
const resetPassword = require('./resetPassword')
const changePassword = require('./changePassword')
//TODO
//changePassword

module.exports = function (app) {
    dashboard(app)
    signin(app)
    signout(app)
    signup(app)
    resetPassword(app)
    changePassword(app)

}