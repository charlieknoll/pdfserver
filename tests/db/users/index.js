const db = require("../../../app/config/db")
const path = require('path')
function sql(file) {
    const sqlDir = '../../app/controllers/sql/'
    const fullPath = path.join(__dirname, file);
    return new pgp.QueryFile(fullPath, { minify: true });
}

const sqlInsertUser = sql('user-insert.sql');
const sqlParams = {
    email: req.body.email,
    displayname: req.body.name,
    uuid: uuidv4(),
    passwordHash: 'test'
}
async function test() {

    await db.none(sqlInsertUser, sqlParams)

}

