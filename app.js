var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var lessMiddleware = require('less-middleware');
var logger = require('morgan');
const asyncHandler = require('express-async-handler')

var indexRouter = require('./routes/index');
var convertRouter = require('./routes/convert');
var generatePdf = require('./routes/pdf');

var app = express();
function nocache(req, res, next) {
  res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
  res.header('Expires', '-1');
  res.header('Pragma', 'no-cache');
  next();
}
//view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(lessMiddleware(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/convert', convertRouter);

app.post('/pdf', nocache, asyncHandler(async (req, res, next) => {
  //TODO add catch to handle errors?
  var content = await generatePdf(req.body);
  res.setHeader('Content-Length', content.length);
  res.contentType('application/pdf')
  //res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `inline; filename=${req.body.fileName}.pdf`);
  //res.meta.fileExtension = 'pdf'
  res.end(content)
  //res.end()
  //next()
}))
// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});


module.exports = app;
