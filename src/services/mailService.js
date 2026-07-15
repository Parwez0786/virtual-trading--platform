const transport = require("../mailer/mailsend");

function sendMail(options) {
  return new Promise((resolve, reject) => {
    transport.sendMail(options, (error, info) => {
      if (error) {
        reject(error);
        return;
      }
      resolve(info);
    });
  });
}

module.exports = { sendMail };
