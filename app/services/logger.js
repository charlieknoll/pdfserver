const winston = require('winston');
const config = require('../config')
const { createLogger, format, transports } = require('winston');
const { combine, timestamp, json, errors, printf } = format;


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
            //json: true,
            maxsize: 5242880, //5MB
            maxFiles: 5,
            colorize: false,
            format: combine(
                timestamp(),
                json(),
            ),
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
logger.stream = {
    write: function (message, encoding) {
        logger.info(message);
    },
};

module.exports = logger;
// module.exports.stream = {
//     write: function (message, encoding) {
//         logger.info(message);
//     }
// };