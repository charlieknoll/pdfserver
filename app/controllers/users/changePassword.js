const { validationResult, body } = require('express-validator/check');
const { sanitizeBody } = require('express-validator/filter');
const { db, logger } = require('../../services')
const bcrypt = require('bcrypt')

const passport = require('passport')
const url = '/user/change-password'
const viewPath = url.substring(1)

const actionVm = function (req, errors, email, displayname) {
    var errMsgs = [].map(e => e.msg)
    return {
        title: 'Change password',
        errors: (errors || []).map(e => e.msg),
        email: email,
        displayname: displayname,
        resetToken: req.query.token
    }
}

const get = async function (req, res, next) {

    try {
        throw (new Error("XXXXXX - testings"))
        const resetToken = req.query.token
        const result = await db.any('Select email, displayname, tokenexpire < CURRENT_TIMESTAMP expired from users where resettoken = ${resetToken}', { resetToken })

        if (result.length === 0 || result[0].expired) {
            req.session.errorMessage = 'The reset token is either invalid or expired, please try again.'
            res.redirect('/user/reset-password')
            return
        }
        res.render(viewPath, actionVm(req, null, result[0].email, result[0].displayname))
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
        if (!/^((?=.*[a-z])(?=.*[0-9])(?=.*[A-Z]))(?=.{8,})/.test(password))
            throw new Error("Password must contain at least 1 upper, lowercase and numeric character")
    }),
]

//handle validation errors
const handleValidationErrors = function (req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const vm = actionVm(req, errors.array(), req.body.username, req.body.displayname)
        res.render(viewPath, vm)
        return
    }
    next()
}
const post = async function (req, res, next) {

    //TODO check that UPDATE worked

    try {
        sqlParams = {
            passwordHash: await bcrypt.hash(req.body.password, 10),
            resetToken: req.query.token,
            email: req.body.username
        }
        const result = await db.result("UPDATE users SET passwordhash = ${passwordHash}, resettoken = null, tokenexpire = null where resettoken = ${resetToken} and email = ${email} and tokenexpire > CURRENT_TIMESTAMP", sqlParams)
        if (result.rowCount !== 1) throw new Error("The reset token is either invalid or expired, please try again")

        //TODO send email confirming password change

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
                if (redirectTo === '/user/dashboard') req.session.successMessage = "Password successfully changed"
                res.redirect(redirectTo);
            });

        })(req, res, next)
    }
    catch (err) {
        logger.error(err)
        req.session.errorMessage = 'Unknown error: the reset token is either invalid or expired, please try again.'
        res.redirect('/user/reset-password')
    }
}
module.exports = function (app) {
    app.get(url, get)
    app.post(url, validate, handleValidationErrors, post)
}