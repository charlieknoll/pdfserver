const { redis } = require('../services')
const config = require('../config')
const axios = require('axios')
const speakeasy = require('speakeasy')



function streamToString(stream) {
  const chunks = []
  return new Promise((resolve, reject) => {
    stream.on('data', chunk => chunks.push(chunk))
    stream.on('error', reject)
    stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')))
  })
}

module.exports = async function (req, res, next) {
  if (!req.query.pdf) {
    next()
    return
  }
  //create speakEasy authtoken
  const authtoken = speakeasy.generateSecretASCII()
  await redis.setex(authtoken, 60, req.user.id)
  var options = {
    method: "POST",
    url: "https://www.responsivepaper.com/api/html2pdf/v2",

    data: {
      value: "https://examples.responsivepaper.com/invoice",
      apikey: "__ENTER_YOUR_APIKEY_HERE___",
      waitForReadyToRender: false,
      disableCache: false,
      includeConsole: false,
      format: "Letter",
      landscape: false,
      printMedia: false,
      timeout: 5000
    },
    responseType: 'stream'
  };
  try {
    options.url = config.responsivepaper.url
    options.data.format = req.query.format
    options.data.landscape = req.query.landscape
    options.data.apikey = config.responsivepaper.apikey
    options.data.value = req.protocol + '://' + req.get('Host') + req.originalUrl.replace("pdf=", "")
    options.data.value += options.data.value.includes('?') ? '&' : '?'
    options.data.value += 'authToken=' + authtoken
    const result = await axios(options)
    result.data.pipe(res)
  } catch (error) {
    const body = await streamToString(error.response.data)
    //TODO parse json
    res.write(body)
    res.end()
  }

}