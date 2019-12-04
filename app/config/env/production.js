const braintree = require('braintree')

module.exports = {
	db: {
		user: process.env.DB_USER,
		password: process.env.DB_PASSWORD,
		database: process.env.DB_NAME,
		host: process.env.DB_HOST,
		port: process.env.DB_PORT,
		max: process.env.DB_MAX_CONNECTIONS,
		idleTimeoutMillis: process.env.DB_IDLE_TIMEOUT,
		ssl: true
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
		environment: braintree.Environment.Production,
		merchantId: process.env.BRAINTREE_MERCHANT_ID,
		publicKey: process.env.BRAINTREE_PUBLIC_KEY,
		privateKey: process.env.BRAINTREE_PRIVATE_KEY,
		webhookToken: process.env.BRAINTREE_WEBHOOK_TOKEN
	},
	responsivepaper: {
		apikey: process.env.RESPONSIVE_PAPER_API_KEY,
		url: "https://www.responsivepaper.com/api/html2pdf/v2"
	}
}
