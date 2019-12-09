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
  hbs.registerHelper("debug", function (optionalValue) {

    if (optionalValue) {
      console.log("Value");
      console.log("====================");
      console.log(optionalValue);
    } else {
      console.log("Current Context");
      console.log("====================");
      console.log(this);

    }
  });
  hbs.registerHelper('prod', () => {
    return process.env.NODE_ENV === 'production';
  })
}