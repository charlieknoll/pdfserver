const baseUrl = 'user/signup'
const validate = require('./validation/signup')

async function post(req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const vm = registerVm(req, errors.array())
        res.render('user/signup', vm)
        return

    }


    //generate token
    const sqlParams = {
        email: req.body.email,
        displayname: req.body.name,
        uuid: uuidv4()

    }

    //generate passwordHash
    const saltRounds = 10 //the higher the better - the longer it takes to generate & compare
    sqlParams.passwordHash = await bcrypt.hash(req.body.password, saltRounds)
    //save to db
    try {
        //TODO convert to QueryFile
        const sql = "INSERT INTO users(email,displayname,passwordhash,usertype,resettoken,tokenexpire) VALUES (${email}, ${displayname},${passwordHash},'user',${uuid}, CURRENT_TIMESTAMP + (15 * interval '1 minute'))"

        await db.none(sql, sqlParams)
        //send email
        const url = 'https://www.responsivepaper.com/user/confirm-registration?token=' + sqlParams.uuid
        const message = {
            to: sqlParams.email,
            subject: 'Confirm your account registration at responsivepaper.com',
            text: `Please click the following link to confirm your responsivepaper.com registration: ${url}`,
            html: `Please click the following link to confirm your responsivepaper.com registration:<br/><br/><a href="${url}">${url}</a>`,
            "o:tracking": 'False'
        };

        await sendEmail(message)
    }
    catch (err) {
        logger.error(err)
        const vm = registerVm(req)
        res.render('user/signup', vm)
    }

    //redirect to emailsent
    res.redirect("/user/account-pending")
}
module.exports = [validate, post];