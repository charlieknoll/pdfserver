

const createError = require('http-errors');
const auth = require('./../middlewares/authorization')
//const homeController = require('./../controllers/home')
const configUserRoutes = require('../controllers/users')
const configConvertRoutes = require('../controllers/convert')
const { logger } = require('../services')
const apiV2 = require('../controllers/api/v2')

module.exports = (app) => {

    app.get('/', function (req, res, next) {
        res.render('home/index', { title: 'Home', layout: 'landing.hbs' })
    })
    configUserRoutes(app)
    configConvertRoutes(app)
    app.use('/api/html2pdf/v2', apiV2)


    // catch 404 and forward to error handler
    app.use(function (req, res, next) {
        logger.warn("Not found: " + req.url)
        next(createError(404));
    });

    // error handler
    app.use(function (err, req, res, next) {
        // set locals, only providing error in development
        if (err.status != 404) logger.error(err.stack)
        res.locals.message = err.message;
        res.locals.error = req.app.get('env') === 'development' ? err : {};

        // render the error page
        err.status = err.status || 500;
        res.status(err.status);
        res.render('error', { title: 'Error' });
    });
}