const db = require("../../config/db")
const { check, validationResult, body } = require('express-validator/check');
const { sanitizeBody } = require('express-validator/filter');
module.exports = [
    //validate form
    sanitizeBody('name').trim().escape(),
    sanitizeBody('email').trim().escape(),
    body('name', 'Name is required').isLength({ min: 1 }),
    body('password', 'Password must be at least 8 characters').isLength({ min: 8 }),
    body('email', 'Valid email is required').isEmail(),
    body('email').custom(async (email) => {
        const results = await db.query('SELECT id FROM users WHERE email = $1', email)
        if (results.length !== 0) throw new Error('Email in use');
    }),
    body('password').custom(async (password, { req }) => {
        if (!/^(((?=.*[a-z])(?=.*[A-Z]))|((?=.*[a-z])(?=.*[0-9]))|((?=.*[A-Z])(?=.*[0-9])))(?=.{8,})/.test(password))
            throw new Error("Password must contain at least 1 upper, lowercase and numeric character")
    }),
]