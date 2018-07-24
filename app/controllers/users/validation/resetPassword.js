const db = require("../../config/db")
const { check, validationResult, body } = require('express-validator/check');
const { sanitizeBody } = require('express-validator/filter');
module.exports = [
    //validate form
    sanitizeBody('email').trim().escape(),
    body('email', 'Valid email is required').isEmail(),
]