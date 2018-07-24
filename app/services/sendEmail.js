const mailgun = require('../config/mailgun')
exports.sendEmail = (message) =>
    new Promise((resolve, reject) => {
        const data = {
            from: 'Account Registration<registration@mg.responsivepaper.com>'
        }
        Object.assign(data, message)
        mailgun.messages().send(data, (error) => {
            if (error) {
                return reject(error);
            }
            return resolve();
        });
    });