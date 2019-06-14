
const path = require('path');
const fs = require('fs');
const { promisify } = require('util')
const readFileAsync = promisify(fs.readFile)

const rpScriptContents = (function () {
    const filename = path.join(__dirname, '..', 'resources', 'reportsjs.min.js')
    return fs.readFileSync(filename, 'utf8')
})();
const rpStyleContents = (function () {
    const filename = path.join(__dirname, '..', 'resources', 'reportsjs.min.css')
    return fs.readFileSync(filename, 'utf8')
})();

//TODO enumerate js and css versions
//TODO validate version
//TODO return default version if requested version not available
const rpContentsProvider = {
    js: async function (version) {
        try {
            const filename = path.join(__dirname, '..', 'resources', 'reportsjs-' + version + '.min.js')
            return await readFileAsync(filename, 'utf8')
        }
        catch {
            return rpScriptContents
        }
    },
    css: async function (version) {
        try {
            const filename = path.join(__dirname, '..', 'resources', 'reportsjs-' + version + '.min.css')
            return await readFileAsync(filename, 'utf8')
        }
        catch (e) {
            //console.log(e)
            return rpStyleContents
        }

    }

}


module.exports = { rpScriptContents, rpStyleContents, rpContentsProvider };