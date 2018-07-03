
const path = require('path');
const fs = require('fs');
const rpScriptContents = (function () {
    const filename = path.join(__dirname, '..', 'resources', 'reportsjs.min.js')
    return fs.readFileSync(filename, 'utf8')
})();
const rpStyleContents = (function () {
    const filename = path.join(__dirname, '..', 'resources', 'reportsjs.min.css')
    return fs.readFileSync(filename, 'utf8')
})();
module.exports = { rpScriptContents, rpStyleContents };