const bcrypt = require('bcrypt')
const LocalStrategy = require('passport-local').Strategy
const { db, logger } = require('../services')
const { combinePassword } = require('../util')
module.exports = (passport) => {
    passport.use(new LocalStrategy(async (email, password, cb) => {
        try {
            const result = await db.any('SELECT id, display_name, email, password_hash, user_type FROM users WHERE email=$1', [email])
            if (result.length > 0) {
                const first = result[0]
                bcrypt.compare(combinePassword(email, password), first.password_hash, function (err, res) {
                    if (res) {
                        cb(null, { id: first.id, userName: first.display_name, type: first.user_type })
                    } else {
                        cb(null, false)
                    }
                })
            } else {
                cb(null, false)
            }
        }
        catch (error) {
            logger.error('Error when selecting user on login', error)
            return cb(error)

        }

    }))



    passport.serializeUser((user, done) => {
        done(null, user.id)
    })

    passport.deserializeUser(async (id, cb) => {
        try {
            const results = await db.query('SELECT id, email, display_name, user_type FROM users WHERE users.id = $1', [parseInt(id, 10)])
            if (results.length == 0) cb(null, null)
            const apikeys = await db.query(`
SELECT apikey.value, apikey.descr
FROM subscription INNER JOIN
apikey ON subscription.id = apikey.subscription_id
WHERE subscription.user_id = $1 and apikey.revoked = false
            `, [parseInt(id, 10)])
            results[0].apikeys = apikeys
            cb(null, results[0])
        }
        catch (err) {
            if (err) {
                logger.error('Error when selecting user on session deserialize', err)
                return cb(err)
            }
        }

    })
    // db.query('SELECT id, username, type FROM users WHERE id = $1', [parseInt(id, 10)], (err, results) => {
    // 	if (err) {
    // 		winston.error('Error when selecting user on session deserialize', err)
    // 		return cb(err)
    // 	}

    // 	cb(null, results.rows[0])
    // })
}

