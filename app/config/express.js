const path = require('path')
const bodyParser = require('body-parser')
const express = require('express')
const hbs = require('express-hbs')
const session = require('express-session')
//const pgSession = require('connect-pg-simple')(session)
const RedisStore = require('connect-redis')(session);
const cookieParser = require('cookie-parser')
const config = require('./')
const { logger, redis } = require('../services')
var morgan = require('morgan');
const handlebars = require('handlebars')
const registerHelpers = require('./hbs-helpers')
module.exports = (app, passport, pool) => {
    // app.use(session({
    //     store: new pgSession({
    //         pool
    //     }),
    //     secret: config.session_secret,
    //     resave: false,
    //     cookie: { maxAge: 14 * 24 * 60 * 60 * 1000 },
    //     saveUninitialized: false
    // }))
    app.use(session({
        store: new RedisStore({
            client: redis
        }),
        secret: config.session_secret,
        resave: false,
        cookie: { maxAge: 14 * 24 * 60 * 60 * 1000 },
        saveUninitialized: false
    }))
    //view engine setup
    app.set('views', path.join(config.root, 'views'));
    app.set('view engine', 'hbs');
    registerHelpers(handlebars)
    app.engine('hbs', hbs.express4({
        defaultLayout: path.join(config.root, '/views/layouts/home.hbs'),
        partialsDir: path.join(config.root, '/views/partials'),
        layoutsDir: path.join(config.root, '/views/layouts'),
        handlebars: handlebars
    }));
    app.use('/', express.static(config.public, { extensions: ['html'] }))
    app.use(morgan('combined', { stream: logger.stream }));
    // app.use(function (req, res, next) {
    //     logger.debug('handling request for: ' + req.url)
    //     next()
    // });

    app.use(bodyParser.json())
    app.use(bodyParser.urlencoded({ extended: true }))
    app.use(cookieParser())



    app.use(passport.initialize())
    // { id: first.id, userName: first.display_name, type: first.user_type, email_hash: first.email_hash }

    app.use(function (req, res, next) {
        if (req.url.match('user') || req.url.match('convert') || req.url.match('admin')) {
            passport.session()(req, res, next)
            //assign req.user to locals
            //req.locals.user = req.user
        } else
            next(); // do not invoke passport
        // same as doing == app.use(passport.session())
    });
    app.use(function (req, res, next) {
        if ((req.url.match('user') || req.url.match('convert') || req.url.match('admin')) && req.user && req.user.id) {
            res.locals.user = { id: req.user.id, userName: req.user.display_name, type: req.user.user_type, email_hash: req.user.email_hash, email: req.user.email }

        }
        next();
    });
}

