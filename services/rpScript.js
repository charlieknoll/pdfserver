
const path = require('path');
const fs = require('fs');
const RpScriptContents = (function () {
    const filename = path.join(__dirname, '..', 'resources', 'reportsjs.min.js')
    return fs.readFileSync(filename, 'utf8')
})();
module.exports = RpScriptContents;