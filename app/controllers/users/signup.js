//dependencies
const { validationResult, body } = require('express-validator');
const { sanitizeBody } = require('express-validator');
const { db, sendEmail, logger } = require('../../services')
const bcrypt = require('bcrypt')
const speakeasy = require('speakeasy')

//constants
const url = '/user/signup'
const viewPath = url.substring(1)

//viewModel
const actionVm = function (req, errors) {
    var errMsgs = [].map(e => e.msg)
    return {
        title: 'Sign up',
        errors: (errors || []).map(e => e.msg),
        name: req.body.name,
        email: req.body.email
    }
}

//get
const get = function (req, res, next) {
    res.render(viewPath, actionVm(req));
}

//validation
const validate = [
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

//handle validation errors
const handleValidationErrors = function (req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const vm = actionVm(req, errors.array())
        res.render(viewPath, vm)
        return
    }
    next()
}
//post

async function post(req, res, next) {

    //generate token
    const sqlParams = {
        email: req.body.email,
        displayname: req.body.name,
        //        uuid: uuidv4()
    }

    //save to db
    try {
        //generate passwordHash
        const saltRounds = 10 //the higher the better - the longer it takes to generate & compare
        sqlParams.passwordHash = await bcrypt.hash(req.body.password, saltRounds)        //TODO convert to QueryFile

        //save to db
        //        const sql = "INSERT INTO users(email,displayname,passwordhash,usertype,resettoken,tokenexpire) VALUES (${email}, ${displayname},${passwordHash},'user',${uuid}, CURRENT_TIMESTAMP + (15 * interval '1 minute'))"
        const sql = "INSERT INTO users(email,displayname,passwordhash,usertype) VALUES (${email}, ${displayname},${passwordHash},'user') RETURNING id"
        const result = await db.one(sql, sqlParams)
        const apiSql = "INSERT INTO apikey(userid,value,descr,usedcredits) VALUES (${userid},${apikey},'Developer',0)"
        const apikey = speakeasy.generateSecretASCII()
        await db.none(apiSql, { userid: result.id, apikey })
        //send email
        // const url = 'https://www.responsivepaper.com/user/confirm-registration?token=' + sqlParams.uuid
        // const message = {
        //     to: sqlParams.email,
        //     subject: 'Confirm your account registration at responsivepaper.com',
        //     text: `Please click the following link to confirm your responsivepaper.com registration: ${url}`,
        //     html: `Please click the following link to confirm your responsivepaper.com registration:<br/><br/><a href="${url}">${url}</a>`,
        //     "o:tracking": 'False'
        // };

        // await sendEmail(message)
    }
    catch (err) {
        logger.error(err)
        error = { msg: err.message }
        const vm = actionVm(req, [error])
        res.render(viewPath, vm)
    }

    //redirect to emailsent
    res.redirect("/user/dashboard")
}

//setup routes
module.exports = function (app) {
    app.get(url, get)
    app.post(url, validate, handleValidationErrors, post)
}
