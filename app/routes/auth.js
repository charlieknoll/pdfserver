var express = require('express');
var router = express.Router();
router.get('/login', function (req, res, next) {
    res.render('auth/login', { title: 'Login' });
});
