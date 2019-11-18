const { validationResult, body } = require('express-validator');
const { sanitizeBody } = require('express-validator');
const { db, logger } = require('../../services')
const bcrypt = require('bcrypt')

const passport = require('passport')
const viewPath = require('../../middlewares/viewPath')
const router = require('express').Router().use(viewPath)
const asyncHandler = require('express-async-handler')


const { combinePassword } = require('../../util')

const actionVm = function (req, errors, email, displayname) {
    return {
        title: 'Change password',
        errors: (errors || []).map(e => e.msg),
        email: email,
        displayname: displayname,
        resetToken: req.query.token,
        layout: 'user-auth'
    }
}

const get = async function (req, res, next) {

    try {
        const resetToken = req.query.token
        const result = await db.any('Select email, display_name, token_expire < CURRENT_TIMESTAMP expired from users where reset_token = ${resetToken}', { resetToken })

        if (result.length === 0 || result[0].expired) {
            req.session.errorMessage = 'The reset token is either invalid or expired, please try again.'
            res.redirect('/user/reset-password')
            return
        }
        res.render(req.viewPath, actionVm(req, null, result[0].email, result[0].display_name))
    }
    catch (err) {
        logger.error(err.message)
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
        res.render(req.viewPath, vm)
        return
    }
    next()
}
const post = async function (req, res, next) {

    //TODO check that UPDATE worked

    try {
        sqlParams = {
            passwordHash: await bcrypt.hash(combinePassword(req.body.username, req.body.password), 10),
            resetToken: req.query.token,
            email: req.body.username
        }
        const result = await db.result("UPDATE users SET password_hash = ${passwordHash}, reset_token = null, token_expire = null where reset_token = ${resetToken} and email = ${email} and token_expire > CURRENT_TIMESTAMP", sqlParams)
        if (result.rowCount !== 1) throw new Error("The reset token is either invalid or expired, please try again")

        //TODO send email confirming password change

        passport.authenticate('local', function (err, user, info) {
            if (err) { return next(err); }
            if (!user) {
                const errs = [{ msg: "Invalid email or password" }]
                res.render(req.viewPath, actionVm(req, errs))
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
router.get('/', get)
router.post('/', validate, handleValidationErrors, asyncHandler(post))

module.exports = router