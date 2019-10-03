const path = require('path')
const bodyParser = require('body-parser')
const express = require('express')
const hbs = require('express-hbs')
const session = require('express-session')
const pgSession = require('connect-pg-simple')(session)
const cookieParser = require('cookie-parser')
const config = require('./')
const { logger } = require('../services')

module.exports = (app, passport, pool) => {

    //view engine setup
    app.set('views', path.join(config.root, 'views'));
    app.set('view engine', 'hbs');
    app.engine('hbs', hbs.express4({
        defaultLayout: path.join(config.root, '/views/layouts/home.hbs'),
        partialsDir: path.join(config.root, '/views/partials'),
        layoutsDir: path.join(config.root, '/views/layouts')
    }));
    app.use('/', express.static(config.public))
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
    app.use(passport.session())
}

