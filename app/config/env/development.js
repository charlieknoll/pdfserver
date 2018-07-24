module.exports = {
	db: {
		user: 'postgres',
		password: 'Test1212',
		database: 'dostest',
		host: '192.168.0.20',
		port: 5432,
		max: 50,
		idleTimeoutMillis: 30000
	},
	session_secret: 'test',
	mailgun: {
		// apikey: '889974a20580df69a7e65b22ad93c47d-770f03c4-d02d2a24',
		// domain: 'sandbox100f273687c74076aa1344674272af13.mailgun.org'
		apikey: '889974a20580df69a7e65b22ad93c47d-770f03c4-d02d2a24',
		domain: 'mg.responsivepaper.com'

	}
}
