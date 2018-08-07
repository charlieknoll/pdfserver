//dependencies
const { logger } = require('../../services')

//constants
const url = '/user/signout'
const viewPath = url.substring(1)


//get
const get = function (req, res, next) {
    res.render(viewPath, { title: 'Sign out' })
}


//post
async function post(req, res, next) {

    //async actions (save to db, send email, etc)
    try {
        var redirectTo = '/';
        //TODO delete session from db
        delete req.session.redirectTo;
        req.session.destroy((err) => {
            if (err) return next(err)
            req.logout()
            res.redirect(redirectTo);
            return
        })
    }
    catch (err) {
        logger.error(err)
        res.render(viewPath)
    }

    //redirect
    //res.redirect("/")
}

//setup routes
module.exports = function (app) {
    app.get(url, get)
    app.post(url, post)
    app.get('/user/logout', function (req, res) {
        res.redirect(url)
    })
}
