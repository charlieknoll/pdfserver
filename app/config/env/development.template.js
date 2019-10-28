module.exports = {
	db: {
		user: 'rp_user',
		password: '',
		database: 'rpdev',
		host: '192.168.0.23',
		port: 5432,
		max: 50,
		idleTimeoutMillis: 30000
	},
	redis: {
		port: 6379,
		host: "192.168.0.23",
		password: ""
	},
	session_secret: 'test',
	mailgun: {
		// apikey: 'TEST',
		// domain: 'sandboxsafsdsdf.mailgun.org'
		apikey: 'Test',
		domain: 'Test'

	},
	browserPool: {
		max: 2,
		min: 2,
		maxWaitingClients: 50,

	}
}
