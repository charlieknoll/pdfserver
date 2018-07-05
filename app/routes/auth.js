const express = require('express');
const router = express.Router();

module.exports = (passport) => {
    router.get('/login', function (req, res, next) {
        res.render('auth/login', { title: 'Login' });
    });
    router.post('/login', passport.authenticate('local', { failureRedirect: '/auth/login' }), function (req, res, next) {
        var redirectTo = req.session.redirectTo ? req.session.redirectTo : '/';
        delete req.session.redirectTo;
        res.redirect(redirectTo);
    });
    return router;

}
