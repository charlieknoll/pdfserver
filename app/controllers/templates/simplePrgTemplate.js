//dependencies
const { db, sendEmail, logger } = require('../../services')

//constants
const url = '/area/action'
const viewPath = baseUrl.substring(1)


//get
const get = function (req, res, next) {
    res.render(viewPath, { title: 'Title' })
}


//post
async function post(req, res, next) {

    //async actions (save to db, send email, etc)
    try {

    }
    catch (err) {
        logger.error(err)
        res.render(viewPath)
    }

    //redirect
    res.redirect("/area/successredirecturl")
}

//setup routes
module.exports = function (app) {
    app.get(url, get)
    app.post(url, post)
}
