const { check, validationResult, body } = require('express-validator/check');
const { sanitizeBody } = require('express-validator/filter');
const logger = require('../config/logger')
const userModel = require('../models/userModel')
const db = require("../config/db")
const passport = require('passport')
const uuidv4 = require('uuid/v4');
const bcrypt = require('bcrypt')
const { sendEmail } = require('../services/sendEmail')
const signup = require('./signup')

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
    postResetPassword: function (req, res, next) {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            const vm = registerVm(req, errors.array())
            res.render('user/signup', vm)
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
            //send email
            const url = 'https://www.responsivepaper.com/user/confirm-registration?token=' + sqlParams.uuid
            const message = {
                to: sqlParams.email,
                subject: 'Confirm your account registration at responsivepaper.com',
                text: `Please click the following link to confirm your responsivepaper.com registration: ${url}`,
                html: `Please click the following link to confirm your responsivepaper.com registration:<br/><br/><a href="${url}">${url}</a>`,
                "o:tracking": 'False'
            };

            await sendEmail(message)
        }
        catch (err) {
            logger.error(err)
            const vm = registerVm(req)
            res.render('user/signup', vm)
        }
        //check that email is in system

        //if email exists set the reset token and expire, send reset link

        //if email doesn't exist, send the entered email address:
        //https://www.troyhunt.com/content/images/2016/02/22382237SNAGHTML3203cc13.png

        //in either case redirect to password reset in process
        res.redirect('/user/passwordresetpending', { title: 'Password Reset Pending' })
    },
    getSignup: function (req, res, next) {
        res.render('user/signup', registerVm(req));
    },
    getDashboard: function (req, res, next) {

        res.render('user/dashboard', Object.assign(userModel.dashboardVm(req), { title: "Dashboard" }));

    }
}


