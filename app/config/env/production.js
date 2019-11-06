module.exports = {
	db: {
		user: process.env.DB_USER,
		password: process.env.DB_PASSWORD,
		database: process.env.DB_NAME,
		host: process.env.DB_HOST,
		port: process.env.DB_PORT,
		max: process.env.DB_MAX_CONNECTIONS,
		idleTimeoutMillis: process.env.DB_IDLE_TIMEOUT
	},
	redis: {
		password: process.env.REDIS_PASSWORD,
		host: process.env.REDIS_HOST,
		port: process.env.REDIS_PORT
	},
	session_secret: process.env.SESSION_SECRET,
	mailgun: {
		apikey: process.env.MG_APIKEY,
		domain: 'mg.responsivepaper.com'

	},
	browserPool: {
		max: process.env.BROWSER_POOL_MAX,
		min: process.env.BROWSER_POOL_MIN,
		maxWaitingClients: process.env.BROWSER_POOL_MAX_WAITING,

	},
	braintree: {
		environment: braintree.Environment.Sandbox,
		merchantId: 'hpbdxsbzdtpk6hf6',
		publicKey: 'v8mc6zsqpm7ftwdb',
		privateKey: '02709d038c553c283f3a8086a1a73e54'
	}
}
