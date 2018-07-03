var debug = require('debug')('pdfserver:browser');
const puppeteer = require('puppeteer');
const launchOptions = {}
launchOptions.args = ["--incognito", "--no-sandbox", "--disable-gpu"];
launchOptions.ignoreHTTPSErrors = true;
launchOptions.pipe = true;
// async function getBrowser() {
//     return await puppeteer.launch(launchOptions)
// }
// // let lBrowser
// // Promise.resolve(
// //     getBrowser().then(b => {
// //         lBrowser = b
// //     }))
// // module.exports = lBrowser

// var Browser = (function () {
//     let lBrowser
//     getBrowser().then(b => {
//         lBrowser = b
//     })
//     return lBrowser
// })();
module.exports =  puppeteer.launch(launchOptions)