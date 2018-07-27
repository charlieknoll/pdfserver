// @ts-check
const app = require('express')()
const passport = require('passport')
const { db, logger } = require('./services')


const port = process.env.PORT || 3000


require('./config/passport')(passport)
require('./config/express')(app, passport, db.$pool)
require('./config/routes')(app)


const server = app.listen(port, () => {
  if (app.get('env') === 'test') return

  logger.info('Express app started on port ' + port)
})
server.on('error', onError);
server.on('listening', onListening);
server.on('close', () => {
  logger.info('Closed express server')

  // db.pool.end(() => {
  //   logger.info('Shut down connection pool')
  // })
})



/**
 * Event listener for HTTP server "error" event.
 */

function onError(error) {
  if (error.syscall !== 'listen') {
    throw error;
  }

  var bind = typeof port === 'string'
    ? 'Pipe ' + port
    : 'Port ' + port;

  // handle specific listen errors with friendly messages
  switch (error.code) {
    case 'EACCES':
      console.error(bind + ' requires elevated privileges');
      process.exit(1);
      break;
    case 'EADDRINUSE':
      console.error(bind + ' is already in use');
      process.exit(1);
      break;
    default:
      throw error;
  }
}

/**
 * Event listener for HTTP server "listening" event.
 */

function onListening() {
  var addr = server.address();
  var bind = typeof addr === 'string'
    ? 'pipe ' + addr
    : 'port ' + addr.port;
  logger.info('Listening on ' + bind);
}
