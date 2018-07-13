const { check, validationResult, body } = require('express-validator/check');
const { sanitizeBody } = require('express-validator/filter');
const logger = require('./../config/logger')
const registerVm = function (req, errors) {
    var errMsgs = [].map(e => e.msg)
    return {
        title: 'Create Account',
        errors: (errors || []).map(e => e.msg),
        name: req.body.name,
        email: req.body.email
    }
}

module.exports = (passport, db) => {
    return {
        getLogin: function (req, res, next) {
            const viewObj = {
                title: 'Login',
                loginError: req.session.loginError
            }
            if (viewObj.loginError) delete req.session.loginError
            res.render('user/login', viewObj);
        },
        postLogin: function (req, res, next) {
            passport.authenticate('local', function (err, user, info) {
                if (err) { return next(err); }
                if (!user) {
                    req.session.loginError = "Invalid user name or password"
                    return res.redirect('/user/login')
                }
                req.logIn(user, function (err) {
                    if (err) { return next(err); }
                    var redirectTo = req.session.redirectTo ? req.session.redirectTo : '/user/dashboard';
                    delete req.session.redirectTo;
                    delete req.session.loginError;
                    res.redirect(redirectTo);
                });

            })(req, res, next)


        },
        postLogout: function (req, res, next) {
            var redirectTo = '/';
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
        postRegister: [
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
    }


    // router.post('/login', passport.authenticate('local', { failureRedirect: '/auth/login' }), function (req, res, next) {
    //     var redirectTo = req.session.redirectTo ? req.session.redirectTo : '/user/dashboard';
    //     delete req.session.redirectTo;
    //     res.redirect(redirectTo);
    // });
    // router.post('/logout', function (req, res, next) {
    //     var redirectTo = '/';
    //     delete req.session.redirectTo;
    //     req.session.destroy((err) => {
    //         if (err) return next(err)
    //         req.logout()
    //         res.redirect(redirectTo);
    //     })
    // });
    // router.get('/register', function (req, res, next) {
    //     res.render('auth/register', { title: 'Create Account' });
    // });
    // router.post('/register', isNotLoggedIn, function (req, res, next) {
    //     //validate form
    //     //email doesn't exist
    //     //password requirements
    //     //captcha
    //     //terms checked
    //     //if errors redirect to register


    //     //save to db

    //     //send email

    //     //redirect to emailsent
    // });
    // return router;

}
