//dependencies
const { validationResult, body } = require('express-validator');
const { sanitizeBody } = require('express-validator');
const { db, sendEmail, logger } = require('../../services')
const bcrypt = require('bcrypt')
const { combinePassword } = require('../../util')
const passport = require('passport')
const viewPath = require('../../middlewares/viewPath')
const router = require('express').Router().use(viewPath)
const asyncHandler = require('express-async-handler')
const { createSubscription } = require('../../models/subscription')

const actionVm = function (req, errors) {
    return {
        title: 'Register',
        errors: (errors || []).map(e => e.msg),
        name: req.body.name,
        username: req.body.username,
        layout: 'user-guest'
    }
}

const get = function (req, res, next) {
    res.render(req.viewPath, actionVm(req));
}

//validation
const validate = [
    //validate form
    sanitizeBody('name').trim().escape(),
    sanitizeBody('username').trim().escape(),
    body('name', 'Name is required').isLength({ min: 1 }),
    body('password', 'Password must be at least 8 characters').isLength({ min: 8 }),
    body('username', 'Valid email is required').isEmail(),
    body('username').custom(async (email) => {
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
        res.render(req.viewPath, vm)
        return
    }
    next()
}
//post

async function post(req, res, next) {

    //generate token
    const sqlParams = {
        email: req.body.username,
        displayname: req.body.name,
        //        uuid: uuidv4()
    }

    //save to db
    try {
        //generate passwordHash
        const saltRounds = 10 //the higher the better - the longer it takes to generate & compare
        sqlParams.passwordHash = await bcrypt.hash(combinePassword(req.body.username, req.body.password), saltRounds)
        //TODO convert to QueryFile

        const sql = "INSERT INTO users(email,display_name,password_hash,user_type) VALUES (${email}, ${displayname},${passwordHash},'user') RETURNING id"
        const result = await db.one(sql, sqlParams)
        //TODO DO THIS IN TX?

        createSubscription(result.id, 1, 'Free Testing API Key')
        // const subSql = `
        // INSERT INTO subscription(user_id, pricing_plan_id, start_date, used_credits, credits, rate_limit, concurrent_limit)
        // SELECT ${result.id},pricing_plan.id, CURRENT_DATE, 0, pricing_plan.credits,pricing_plan.rate_limit, pricing_plan.concurrent_limit
        // FROM pricing_plan
        // WHERE pricing_plan.name = 'Free' RETURNING id`
        // const subResult = await db.one(subSql)

        // const apikey = speakeasy.generateSecretASCII()
        // const apiSql = `
        // INSERT INTO apikey (subscription_id, value, descr, revoked) VALUES (${subResult.id},'${apikey}', 'Free Testing API Key', false)
        // `
        // await db.none(apiSql)

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

        //redirect to emailsent
        passport.authenticate('local', function (err, user, info) {
            if (err) { return next(err); }
            if (!user) {
                const errs = [{ msg: "Invalid email or password" }]
                res.render(url.substring(1), actionVm(req, errs))
                return

            }
            req.logIn(user, function (err) {
                if (err) { return next(err); }
                var redirectTo = req.session.redirectTo ? req.session.redirectTo : '/user/dashboard';
                delete req.session.redirectTo;
                if (redirectTo === '/user/dashboard') req.session.successMessage = "Thank you for signing up with responsive paper"
                res.redirect(redirectTo);
            });

        })(req, res, next)

    }
    catch (err) {
        logger.error(err)
        error = { msg: err.message }
        const vm = actionVm(req, [error])
        res.render(req.viewPath, vm)
    }

}

router.get('/', get)
router.post('/', validate, handleValidationErrors, asyncHandler(post))
//setup routes
module.exports = router
