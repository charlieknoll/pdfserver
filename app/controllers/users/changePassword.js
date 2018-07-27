const { validationResult, body } = require('express-validator/check');
const { sanitizeBody } = require('express-validator/filter');
const { db, logger } = require('../../services')
const bcrypt = require('bcrypt')

const passport = require('passport')
const url = '/user/change-password'

const actionVm = function (req, errors, email, displayname) {
    var errMsgs = [].map(e => e.msg)
    return {
        title: 'Change password',
        errors: (errors || []).map(e => e.msg),
        email: email,
        displayname: displayname
    }
}

const get = async function (req, res, next) {
    //TODO validate reset-token, retrieve user name and email
    try {
        const resetToken = req.query.token
        const result = await db.any('Select email, displayname, tokenexpire < CURRENT_TIMESTAMP expired from users where resettoken = ${resetToken}', { resetToken })

        //If invalid or expired reset-token then redirect to Reset-password with error message
        if (result.length === 0 || result[0].expired) {
            req.session.errorMessage = 'The reset token is either invalid or expired, please try again.'
            res.redirect('/user/reset-password')
            return
        }
        res.render(url.substring(1), actionVm(req, null, result[0].email, result[0].displayname))
    }
    catch (err) {
        logger.error(err)
        req.session.errorMessage = 'Unknown error: the reset token is either invalid or expired, please try again.'
        res.redirect('/user/reset-password')
    }
}

//validation
const validate = [
    //validate form
    body('password', 'Password must be at least 8 characters').isLength({ min: 8 }),
    body('password').custom(async (password, { req }) => {
        if (!/^(((?=.*[a-z])(?=.*[A-Z]))|((?=.*[a-z])(?=.*[0-9]))|((?=.*[A-Z])(?=.*[0-9])))(?=.{8,})/.test(password))
            throw new Error("Password must contain at least 1 upper, lowercase and numeric character")
    }),
    //TODO validate reset token not expired
]

//handle validation errors
const handleValidationErrors = function (req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const vm = actionVm(req, errors.array())
        res.render(viewPath, vm)
        return
    }
    next()
}
const post = function (req, res, next) {
    //TODO add succcess message to dashboard

    //TODO update password in database

    passport.authenticate('local', function (err, user, info) {
        if (err) { return next(err); }
        if (!user) {
            const errs = [{ msg: "Invalid email or password" }]
            res.render(url.substring(1), actionVm(req, errs))
            return

        }
        req.logIn(user, function (err) {
            if (err) { return next(err); }
            var redirectTo = req.session.redirectTo ? req.session.redirectTo : '/user/dashboard';
            delete req.session.redirectTo;
            res.redirect(redirectTo);
        });

    })(req, res, next)


}
module.exports = function (app) {
    app.get(url, get)
    app.post(url, post)
}