const hbs = require('handlebars')
module.exports = function () {
  hbs.registerHelper('ifeq', function (a, b, options) {
    if (a == b) { return options.fn(this); }
    return options.inverse(this);
  });
  hbs.registerHelper('ifinc', function (a, b, options) {
    if (a.includes(b)) { return options.fn(this); }
    return options.inverse(this);
  });

}