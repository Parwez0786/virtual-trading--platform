const jwt = require("jsonwebtoken");
const db = require("../services/db");
const { sendMail } = require("../services/mailService");
const crypt = require("../utils/crypt");
const {
  AuthSecrets,
  TokenConfig,
  Routes,
  ViewNames,
  FlashKeys,
  FlashMessages,
  EmailTemplates,
  FormFields,
  appBaseUrl,
} = require("../constants/enums");

function query(sql, values) {
  return new Promise((resolve, reject) => {
    db.query(sql, values, (error, results) => (error ? reject(error) : resolve(results)));
  });
}

function forgetPassword(req, res) {
  res.render(ViewNames.FORGET_PASSWORD, { message: req.flash(FlashKeys.MESSAGE) });
}

async function postForgetPassword(req, res) {
  const email = req.body[FormFields.EMAIL];
  try {
    const result = await query(
      "SELECT username, email, password FROM stockuser WHERE email = ?",
      [email]
    );
    if (!result[0]) {
      req.flash(FlashKeys.MESSAGE, FlashMessages.NO_EMAIL_FOUND);
      return res.redirect(Routes.FORGET_PASSWORD);
    }
    const user = result[0];
    const token = jwt.sign(
      { id: user.username, email: user.email },
      AuthSecrets.JWT + user.password,
      { expiresIn: TokenConfig.EXPIRES_IN }
    );
    const link = `${appBaseUrl()}${Routes.RESET_PASSWORD}/${user.username}/${token}`;
    await sendMail({
      from: process.env.MAIL_FROM || process.env.SMTP_USER || process.env.EMAIL_USER,
      to: email,
      subject: EmailTemplates.FORGOT_SUBJECT,
      text: EmailTemplates.FORGOT_BODY(link),
    });
    req.flash(FlashKeys.MESSAGE, FlashMessages.AUTH_MAIL_SENT);
    res.redirect(Routes.FORGET_PASSWORD);
  } catch (error) {
    req.flash(
      FlashKeys.MESSAGE,
      error && error.code ? FlashMessages.USER_NOT_REGISTERED : FlashMessages.EMAIL_SEND_FAILED_GMAIL
    );
    res.redirect(Routes.FORGET_PASSWORD);
  }
}

async function findUser(id) {
  const result = await query(
    "SELECT username, password FROM stockuser WHERE username = ?",
    [id]
  );
  return result[0];
}

async function resetPassword(req, res) {
  const { id, token } = req.params;
  try {
    const user = await findUser(id);
    if (!user) throw new Error("invalid");
    jwt.verify(token, AuthSecrets.JWT + user.password);
    res.render(ViewNames.RESET_PASSWORD, { id, token });
  } catch (error) {
    req.flash(FlashKeys.MESSAGE, FlashMessages.INVALID);
    res.redirect(Routes.FORGET_PASSWORD);
  }
}

async function postResetPassword(req, res) {
  const { id, token } = req.params;
  const password = req.body[FormFields.PASSWORD];
  const confirmPassword = req.body.confirm_password;
  if (password !== confirmPassword) {
    req.flash(FlashKeys.MESSAGE, FlashMessages.ENTER_CORRECT_PASSWORD);
    return res.redirect(`${Routes.RESET_PASSWORD}/${id}/${token}`);
  }
  try {
    const user = await findUser(id);
    if (!user) throw new Error("invalid");
    jwt.verify(token, AuthSecrets.JWT + user.password);
    await query("UPDATE stockuser SET password = ? WHERE username = ?", [
      crypt.encrypt(confirmPassword),
      id,
    ]);
    req.flash(FlashKeys.MESSAGE, FlashMessages.PASSWORD_CHANGED);
    res.redirect(Routes.LOGIN);
  } catch (error) {
    req.flash(FlashKeys.MESSAGE, FlashMessages.INVALID);
    res.redirect(Routes.FORGET_PASSWORD);
  }
}

module.exports = { forgetPassword, postForgetPassword, resetPassword, postResetPassword };
