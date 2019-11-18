//dependencies
const { logger } = require('../../services')
const viewPath = require('../../middlewares/viewPath')
const router = require('express').Router().use(viewPath)


const get = function (req, res, next) {
    res.render(req.viewPath, { title: 'Sign out', layout: 'user-auth' })
}
function post(req, res, next) {
    delete req.session.redirectTo;
    req.session.destroy((err) => {
        if (err) return next(err)
        req.logout()
        res.redirect('/');
        return
    })
}
router.get('/', get)
router.post('/', post)

module.exports = router