const config = require('./config')
const { db } = require('./services')
const path = require('path')
const fs = require('fs')


function streamToHex(stream) {
  const chunks = []
  return new Promise((resolve, reject) => {
    stream.on('data', chunk => chunks.push(chunk))
    stream.on('error', reject)
    stream.on('end', () => resolve(Buffer.concat(chunks).toString('hex')))
  })
}
async function run() {
  //create email hashes
  const hashes = await db.manyOrNone('SELECT id, MD5(email) email_hash FROM users')
  for (var i = 0; i < hashes.length; i++) {
    //read from file
    dest = path.join(config.public, '/images/gravatars/') + hashes[i].email_hash + '.jpg'
    const stream = fs.createReadStream(dest);
    var columnDataToInsert = '\\x' + await streamToHex(stream)
    await db.none("UPDATE users set image = $1 WHERE id = $2", [columnDataToInsert, hashes[i].id])

  }
}
run()

//read from file

//update db