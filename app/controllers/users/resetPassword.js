const { validationResult, body } = require('express-validator');
const { sanitizeBody } = require('express-validator');
const { db, sendEmail, logger } = require('../../services')
const uuidv4 = require('uuid/v4')

const url = '/user/reset-password'
const viewPath = url.substring(1)

const resetPasswordVm = function (req, errors) {
    var errMsgs = [].map(e => e.msg)
    return {
        title: 'Reset Password',
        errors: (errors || []).map(e => e.msg)
    }
}
const get = function (req, res, next) {
    const errors = []
    if (req.session.errorMessage) {
        errors.push({ msg: req.session.errorMessage })
        delete req.session.errorMessage;
    }
    res.render(viewPath, resetPasswordVm(req, errors));
}

const validate = [
    //validate form
    sanitizeBody('email').trim().escape(),
    body('email', 'Valid email is required').isEmail(),
]

const handleValidationErrors = function (req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const vm = resetPasswordVm(req, errors.array())
        res.render(viewPath, vm)
        return
    }
    next()
}

const handleValidEmail = async function (email) {
    //TODO convert to QueryFile
    //generate token
    const sqlParams = {
        email: email,
        uuid: uuidv4()
    }
    const sql = "Update users set reset_token=${uuid},token_expire= CURRENT_TIMESTAMP + (15 * interval '1 minute') WHERE email=${email}"
    await db.none(sql, sqlParams)

    //send email
    const url = 'https://www.responsivepaper.com/user/change-password?token=' + sqlParams.uuid
    const message = {
        to: sqlParams.email,
        subject: 'Password reset request from responsivepaper.com',
        text: `Please click the following link to change your responsivepaper.com password: ${url}`,
        html: `Please click the following link to change your responsivepaper.com password:<br/><br/><a href="${url}">${url}</a>
        <br/><br/>
        This link expires 15 minutes after the reset was requested. If you are a Responsive Paper account holder and were not expecting this email, please disregard this message.
        <br/><br/>
        Kind regards,
        <br/><br/>
        Responsive Paper Support<br/>
        www.responsivepaper.com

        `,
        "o:tracking": 'False'
    };

    await sendEmail(message)
}
const handleInvalidEmail = async function (email) {
    const content = `You (or someone else) entered this email address when trying to change the password of a Responsive Paper account.
        <br/><br/>
        However, this email address is not in our database of registered users and therefor the attempted password change has failed.
        <br/><br/>
        If you are a Responsive Paper account holder and were expecting this email, please try again using the email address you gave when opening your account.
        <br/><br/>
        Kind regards,
        <br/><br/>
        Responsive Paper Support<br/>
        www.responsivepaper.com
        `
    const message = {
        to: email,
        subject: 'Invalid password reset request at responsivepaper.com',
        text: content.replace('<br/>', ''),
        html: content,
        "o:tracking": 'False'
    }

    await sendEmail(message)
}
const post = async function (req, res, next) {

    try {
        const result = await db.any('SELECT id FROM users WHERE email=$1', [req.body.email])
        if (result.length !== 0) {
            await handleValidEmail(req.body.email)
        } else {
            await handleInvalidEmail(req.body.email)
        }
    }
    catch (err) {
        logger.error(err)
        error = { msg: err.message }
        const vm = resetPasswordVm(req, [error])
        res.render(viewPath, vm)
        return
    }
    res.redirect('/user/reset-pending')
}

module.exports = function (app) {
    app.get(url, get)
    app.get('/user/reset-pending', (req, res) => res.render('user/reset-pending', { title: 'Password Reset Pending' }))
    app.post(url, validate, handleValidationErrors, post)
}