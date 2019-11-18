const auth = require('../../middlewares/authorization')
const { arrayToSelectList } = require('../../util')
const qs = require('qs')
const asyncHandler = require('express-async-handler')
const generatePdf = require('../../services/generatePdf')
const { rateLimiter, waitLimiter, concurrentLimiter } = require('../../services/rateLimiter')
const { replaceAll } = require('../../util')
const rpContent = require('../../services/rpContent')
const { db } = require('../../services')
const logs = require('../../models/logs')
const router = require('express').Router()

const actionVm = async function (req, errors) {
  var errMsgs = [].map(e => e.msg)

  const vals = qs.parse(req.query)

  const formData = {
    formats: rpContent.formats,
    versions: rpContent.versions
  }
  if (req.originalUrl == '/convert') {
    formData.title = 'Convert UI',
      formData.convert = 'active'
  } else {
    formData.title = 'Convert API',
      formData.convertApi = 'active'
  }

  if (vals) {
    Object.assign(formData, vals)
  }
  formData.formats = arrayToSelectList(formData.formats, vals['format'] || '', true)
  formData.versions = arrayToSelectList(formData.versions, vals['version'] || '', true)
  formData.errors = (errors || []).map(e => e.msg)
  //TODO look up user's developer apiKey
  const apikeys = await db.any(`
SELECT        apikey.value, apikey.descr, apikey.revoked, apikey.subscription_id
FROM            apikey INNER JOIN
                         subscription ON apikey.subscription_id = subscription.id
WHERE subscription.user_id = $1 and subscription.cancel_date is null
    `, req.user.id)
  formData.apikeys = arrayToSelectList(apikeys.map(a => { return { value: a.value, label: a.descr ? a.descr + " : " + a.value : a.value } }), vals['apikey'] || apikeys[0].value, false)
  return formData
}
const get = async function (req, res, next) {
  const errors = []
  if (req.session.errorMessage) {
    errors.push({ msg: req.session.errorMessage })
    delete req.session.errorMessage;
  }
  res.render('convert/convert', await actionVm(req, errors));
}
const post = async function (req, res, next) {
  let logsSaved = false
  try {
    if (req.rp.include_console) req.body.includeConsole = true
    const result = await generatePdf(req.body);

    if (!result) throw new Error('Error creating pdf')
    await logs.save(result, req)
    logsSaved = true
    res.set('Content-Type', 'application/pdf')
    let fileName = req.body.fileName || result.pageTitle
    fileName = replaceAll(fileName, ' ', '-')
    if (fileName == '') {
      if (req.body.value && req.body.value.substring(0, 4).toLowerCase() === 'http') {
        var matches = req.body.value.match(/:\/\/(?:www\.)?(.[^/]+)(.*)/);
        fileName = matches[matches.length - 1]
        fileName = replaceAll(fileName, '/', '')
      }
      if (fileName == '') {
        fileName = 'converted'
      }
    }
    fileName = replaceAll(fileName, ',', ' ')
    fileName += ".pdf";

    res.set('Content-Disposition', 'inline; filename=' + fileName)
    if (result.content) {
      res.send(result.content)
    }
    else {
      res.end()
    }
  }
  catch (e) {
    if (!logsSaved && e.requestLog) logs.save(e, req)
    res.render('convert/convert-error', { title: 'Conversion Error', error: e, layout: 'user-blank' })
    return

  }

}
router.get('/api', auth.requiresUser, asyncHandler(get))
router.get('/', auth.requiresUser, asyncHandler(get))
router.post('/', asyncHandler(auth.requiresApiKey), asyncHandler(concurrentLimiter), asyncHandler(rateLimiter), asyncHandler(post))
module.exports = router

