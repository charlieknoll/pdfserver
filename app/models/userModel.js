const db = require('../config/db')

module.exports = {

    dashboardVm: function (req) {
        return { name: req.user.displayname }
    },
    addUser: function () {

    }
}