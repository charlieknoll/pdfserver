
const passport = require('passport')
const viewPath = require('../../middlewares/viewPath')
const router = require('express').Router().use(viewPath)


const signinVm = function (req, errors) {
    var errMsgs = [].map(e => e.msg)
    return {
        title: 'Sign In',
        errors: (errors || []).map(e => e.msg)
    }
}

const get = function (req, res, next) {
    res.render(req.viewPath, signinVm(req));
}
const post = function (req, res, next) {
    passport.authenticate('local', function (err, user, info) {
        if (err) { return next(err); }
        if (!user) {
            const errs = [{ msg: "Invalid email or password" }]
            res.status(403)
            res.render(req.viewPath, signinVm(req, errs))
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

router.get('/', get)
router.post('/', post)
module.exports = router
