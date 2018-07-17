const { check, validationResult, body } = require('express-validator/check');
const { sanitizeBody } = require('express-validator/filter');
const logger = require('../config/logger')
const userModel = require('../models/userModel')
const registerVm = function (req, errors) {
    var errMsgs = [].map(e => e.msg)
    return {
        title: 'Create Account',
        errors: (errors || []).map(e => e.msg),
        name: req.body.name,
        email: req.body.email
    }
}
const loginVm = function (req, errors) {
    var errMsgs = [].map(e => e.msg)
    return {
        title: 'Login',
        errors: (errors || []).map(e => e.msg)
    }
}
module.exports = (passport, db) => {
    return {
        getLogin: function (req, res, next) {

            res.render('user/login', loginVm(req));
        },
        postLogin: function (req, res, next) {
            passport.authenticate('local', function (err, user, info) {
                if (err) { return next(err); }
                if (!user) {
                    const errs = [{ msg: "Invalid user name or password" }]
                    res.render('user/login', loginVm(req, errs))
                    return

                }
                req.logIn(user, function (err) {
                    if (err) { return next(err); }
                    var redirectTo = req.session.redirectTo ? req.session.redirectTo : '/user/dashboard';
                    delete req.session.redirectTo;
                    res.redirect(redirectTo);
                });

            })(req, res, next)


        },
        getLogout: function (req, res, next) {
            res.render('user/logout')
        },
        postLogout: function (req, res, next) {
            var redirectTo = '/';
            //TODO delete session from db
            delete req.session.redirectTo;
            req.session.destroy((err) => {
                if (err) return next(err)
                req.logout()
                res.redirect(redirectTo);
            })
        },
        getRegister: function (req, res, next) {

            res.render('user/register', registerVm(req));
        },
        postRegister: function () {
            return [
                //validate form
                sanitizeBody('name').trim().escape(),
                sanitizeBody('email').trim().escape(),
                body('name', 'Name is required').isLength({ min: 1 }),
                body('password', 'Password is required').isLength({ min: 8 }),
                body('email', 'Valid email is required').isEmail().normalizeEmail(),
                body('email').custom(async (email) => {
                    const results = await db.query('SELECT id FROM users WHERE email = $1', email)
                    if (results.length === 0) throw new Error('Email in use');
                }),
                body('password').custom(async (password, { req }) => {
                    if (password !== req.body.matchPassword) {
                        throw new Error("Passwords do not match")
                    }
                }),
                async function (req, res, next) {
                    const errors = validationResult(req);
                    if (!errors.isEmpty()) {
                        const vm = registerVm(req, errors.array())
                        res.render('user/register', vm)
                        return

                    }
                    res.redirect("/user/dashboard")


                    //email doesn't exist
                    //password requirements
                    //captcha
                    //terms checked
                    //if errors redirect to register


                    //save to db


                    //send email

                    //redirect to emailsent
                }
            ]
        },
        getDashboard: function (req, res, next) {

            res.render('user/dashboard', userModel.dashboardVm(req));

        }
    }

}
