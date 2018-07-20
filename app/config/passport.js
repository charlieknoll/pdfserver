const bcrypt = require('bcrypt')
const logger = require('../config/logger')
const LocalStrategy = require('passport-local').Strategy
const db = require("../config/db")

module.exports = (passport) => {
    passport.use(new LocalStrategy(async (email, password, cb) => {
        try {
            const result = await db.any('SELECT id, displayname, passwordhash, usertype FROM users WHERE email=$1 and resettoken IS NULL', [email])
            if (result.length > 0) {
                const first = result[0]
                bcrypt.compare(password, first.passwordhash, function (err, res) {
                    if (res) {
                        cb(null, { id: first.id, username: first.displayname, type: first.usertype })
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
            const results = await db.query('SELECT id, email, displayname, usertype FROM users WHERE id = $1', [parseInt(id, 10)])
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

