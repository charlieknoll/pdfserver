module.exports = function (req, res, next) {
  req.viewPath = req.baseUrl.substring(1)
  next()
}
