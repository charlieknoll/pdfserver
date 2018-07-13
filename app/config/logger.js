const winston = require('winston');
const config = require('./')

// var transport = new winston.transports.();
// const logger = winston.createLogger({
//     transports: [transport]
// })

var logger = winston.createLogger({
    transports: [
        new winston.transports.File({
            level: 'info',
            filename: config.logFile,
            handleExceptions: true,
            json: true,
            maxsize: 5242880, //5MB
            maxFiles: 5,
            colorize: false
        }),
        new winston.transports.Console({
            level: 'debug',
            handleExceptions: true,
            json: false,
            colorize: true
        })
    ],
    exitOnError: false
});

module.exports = logger;
// module.exports.stream = {
//     write: function (message, encoding) {
//         logger.info(message);
//     }
// };