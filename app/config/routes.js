const createError = require('http-errors');
const auth = require('./../middlewares/authorization')
const configConvertRoutes = require('../controllers/convert')
const { logger } = require('../services')

module.exports = (app) => {
    app.get('/', function (req, res, next) {
        res.render('home/index', { title: 'Home', layout: 'landing.hbs' })
    })
    app.use('/user', require('../controllers/user'))
    app.use('/webhooks', require('../controllers/webhooks'))
    configConvertRoutes(app)
    app.use('/api/html2pdf/v2', require('../controllers/api/v2'))
    app.use('/admin', require('../controllers/admin'))


    //catch 404 and forward to error handler
    app.use(function (req, res, next) {
        next(createError(404));
    });

    // error handler
    app.use(function (err, req, res, next) {
        // set locals, only providing error in development
        if (err.status != 404) logger.error(err.message)
        res.locals.message = err.message;
        res.locals.error = req.app.get('env') === 'development' ? err : { status: err.status };

        err.status = err.status || 500;
        const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
        if (err.status == 404) {
            logger.warn(`404 - ${err.message} - ${req.originalUrl} - ${req.method} - ${ip}`);

        } else {
            logger.error(`${err.status || 500} - ${err.message} - ${req.originalUrl} - ${req.method} - ${ip}`);

        }
        res.status(err.status);
        res.render('error', { title: 'Error' });
    });
}