
const path = require('path');
const fs = require('fs');
const { promisify } = require('util')
const readFileAsync = promisify(fs.readFile)
const readdirAsync = promisify(fs.readdir)
const rpScriptContents = {}
const rpStyleContents = {}
// const versions = (function () {
// })();


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

    },
    readVersions: async function () {
        const filePath = path.join(__dirname, '..', 'resources')
        const versionList = []
        const items = await readdirAsync(filePath)
        for (var i = 0; i < items.length; i++) {
            if (items[i].startsWith('reportsjs-') && items[i].endsWith('.js')) {
                versionList.push(items[i].replace('reportsjs-', '').replace('.min.js', ''))
            }
        }
        return versionList.sort(function (a, b) { return a < b })


    },
    rpScriptContents: {},
    rpStyleContents: {},
    versions: [],
    init: async function () {
        this.versions = await this.readVersions()
        const results = await Promise.all([this.js(this.versions[0]), this.css(this.versions[0])])
        this.rpScriptContents = results[0]
        this.rpStyleContents = results[1]
        this.formats = ['Letter', 'Legal', 'Ledger', 'Tabloid', 'A4', 'A5', 'A6']

    }
}
rpContentsProvider.init()

module.exports = rpContentsProvider;