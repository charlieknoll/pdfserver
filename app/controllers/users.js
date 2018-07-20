const { check, validationResult, body } = require('express-validator/check');
const { sanitizeBody } = require('express-validator/filter');
const logger = require('../config/logger')
const userModel = require('../models/userModel')
const db = require("../config/db")
const passport = require('passport')
const uuidv4 = require('uuid/v4');
const bcrypt = require('bcrypt')

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
const resetPasswordVm = function (req, errors) {
    var errMsgs = [].map(e => e.msg)
    return {
        title: 'Reset Password',
        errors: (errors || []).map(e => e.msg)
    }
}
module.exports = {
    getLogin: function (req, res, next) {

        res.render('user/login', loginVm(req));
    },
    postLogin: function (req, res, next) {
        passport.authenticate('local', function (err, user, info) {
            if (err) { return next(err); }
            if (!user) {
                const errs = [{ msg: "Invalid email or password" }]
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
    getResetPassword: function (req, res, next) {

        res.render('user/reset-password', resetPasswordVm(req));
    },
    getRegister: function (req, res, next) {
        res.render('user/register', registerVm(req));
    },
    postRegister: async function (req, res, next) {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            const vm = registerVm(req, errors.array())
            res.render('user/register', vm)
            return

        }


        //generate token
        const sqlParams = {
            email: req.body.email,
            displayname: req.body.name,
            uuid: uuidv4()

        }

        //generate passwordHash
        const saltRounds = 10 //the higher the better - the longer it takes to generate & compare
        sqlParams.passwordHash = await bcrypt.hash(req.body.password, saltRounds)
        //save to db
        try {
            //TODO convert to QueryFile
            const sql = "INSERT INTO users(email,displayname,passwordhash,usertype,resettoken,tokenexpire) VALUES (${email}, ${displayname},${passwordHash},'user',${uuid}, CURRENT_TIMESTAMP + (15 * interval '1 minute'))"

            await db.none(sql, sqlParams)
        }
        catch (err) {
            const vm = registerVm(req)
            res.render('user/register', vm)
        }

        //send email

        //redirect to emailsent
        res.redirect("/user/account-pending")
    },
    getDashboard: function (req, res, next) {

        res.render('user/dashboard', Object.assign(userModel.dashboardVm(req), { title: "Dashboard" }));

    }
}


