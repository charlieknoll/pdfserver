const path = require('path')
const bodyParser = require('body-parser')
const express = require('express')
const hbs = require('express-hbs')
const session = require('express-session')
const pgSession = require('connect-pg-simple')(session)
const cookieParser = require('cookie-parser')
const config = require('./')
const { logger } = require('../services')
const handlebars = require('handlebars')
const registerHelpers = require('./hbs-helpers')
module.exports = (app, passport, pool) => {

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
    app.use(function (req, res, next) {
        logger.debug('handling request for: ' + req.url)
        next()
    });
    app.use(bodyParser.json())
    app.use(bodyParser.urlencoded({ extended: true }))
    app.use(cookieParser())

    app.use(session({
        store: new pgSession({
            pool
        }),
        secret: config.session_secret,
        resave: false,
        cookie: { maxAge: 14 * 24 * 60 * 60 * 1000 },
        saveUninitialized: false
    }))

    app.use(passport.initialize())
    app.use(function (req, res, next) {
        if (req.url.match('user') || req.url.match('convert'))
            passport.session()(req, res, next)
        else
            next(); // do not invoke passport
        // same as doing == app.use(passport.session())
    });
}

