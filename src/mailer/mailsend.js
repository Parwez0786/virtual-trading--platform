require("dotenv").config({ path: require("path").join(__dirname, "../../.env") });
var nodemailer = require("nodemailer");
const { SmtpConfig } = require("../constants/enums");

const emailUser = process.env.SMTP_USER || process.env.EMAIL_USER;
const emailPass = process.env.SMTP_PASS || process.env.EMAIL_PASS;

var transport = nodemailer.createTransport({
  host: SmtpConfig.HOST,
  port: SmtpConfig.PORT,
  secure: SmtpConfig.SECURE,
  requireTLS: true,
  auth: {
    user: emailUser,
    pass: emailPass,
  },
});

module.exports = transport;
