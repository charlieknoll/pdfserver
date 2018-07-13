

const createError = require('http-errors');
const auth = require('./../middlewares/authorization')
const homeController = require('./../controllers/home')


module.exports = (app, passport, db, logger) => {
    const userController = require('./../controllers/users')(passport, db)
    app.get('/', function (req, res, next) {
        res.render('home/index', { title: 'Home' })
    })

    //User related endpoints
    app.get('/user/login', userController.getLogin)
    app.post('/user/login', userController.postLogin)
    app.get('/user/register', userController.getRegister)
    app.post('/user/register', userController.postRegister)


    //pdf endpoints
    app.get('/urlconvert', auth.requiresLogin, homeController.urlConvert)

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
        res.status(err.status || 500);
        res.render('error', { title: 'Error' });
    });
}