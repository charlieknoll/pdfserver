//dependencies
const { validationResult, body } = require('express-validator');
const { sanitizeBody } = require('express-validator');
const { db, sendEmail, logger } = require('../../services')

//constants
const baseUrl = '/area/action'
const viewPath = baseUrl.substring(1)

//viewModel
const actionVm = function (req, errors) {
    var errMsgs = [].map(e => e.msg)
    return {
        title: 'Title',
        errors: (errors || []).map(e => e.msg),
        // name: req.body.name,
        // email: req.body.email
    }
}

//get
const get = function (req, res, next) {
    res.render(viewPath, actionVm(req));
}

//validation
const validate = [
    //validate form

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

    //async actions (save to db, send email, etc)
    try {

    }
    catch (err) {
        logger.error(err)
        error = { msg: err.message }
        const vm = signupVm(req, [error])
        res.render(viewPath, vm)
    }

    //redirect
    res.redirect("/area/successredirecturl")
}

//setup routes
module.exports = function (app) {
    app.get(url, get)
    app.post(url, validate, handleValidationErrors, post)
}
