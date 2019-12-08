//@ts-check
const path = require('path')

const development = (process.env.NODE_ENV !== 'production') ? require('./env/development') : {}
const test = require('./env/test')
const production = require('./env/production')

const defaults = {
	root: path.join(__dirname, '..'),
	public: path.join(__dirname, '../../public'),
	logFile: path.join(__dirname, '../../logs/all-logs.log')
}

module.exports = {
	development: Object.assign({}, defaults, development),
	test: Object.assign({}, defaults, test),
	production: Object.assign({}, defaults, production)
}[process.env.NODE_ENV || 'development']
