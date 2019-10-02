var debug = require('debug')('pdfserver:browser');
const puppeteer = require('puppeteer');
const launchOptions = {}
launchOptions.args = ["--incognito", "--no-sandbox", "--disable-gpu"];
launchOptions.ignoreHTTPSErrors = true;
launchOptions.pipe = true;
module.exports = puppeteer.launch(launchOptions)