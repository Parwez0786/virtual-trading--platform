const express = require("express");
var db = require("../database/db");
const router = express.Router();
const jwt = require("jsonwebtoken");
const transport = require("../mailer/mailsend");
const crypt = require("../utils/crypt");
const {
  AuthSecrets,
  TokenConfig,
  ServerConfig,
  Routes,
  ViewNames,
  FlashKeys,
  FlashMessages,
  EmailTemplates,
  FormFields,
  appBaseUrl,
} = require("../constants/enums");

var password_from_database;
var email_from_database;
var enrollment;

router.get("/forget-password", async (req, res, next) => {
  res.render(ViewNames.FORGET_PASSWORD, {
    message: req.flash(FlashKeys.MESSAGE),
  });
});

router.post("/forget-password", async (req, res, next) => {
  const email = req.body[FormFields.EMAIL];

  var sql = `select  username,  email ,password from stockuser where email='${email}'`;
  db.query(sql, function (err, result) {
    if (err) {
      req.flash(FlashKeys.MESSAGE, FlashMessages.USER_NOT_REGISTERED);
      return res.redirect(ViewNames.LOGIN);
    }
    if (!result[0]) {
      req.flash(FlashKeys.MESSAGE, FlashMessages.NO_EMAIL_FOUND);
      return res.redirect(Routes.FORGET_PASSWORD);
    }
    email_from_database = result[0].email;
      password_from_database = result[0].password;
      enrollment = result[0].username;

      if (email != email_from_database) {
        req.flash(FlashKeys.MESSAGE, FlashMessages.NO_EMAIL_FOUND);
        res.redirect(Routes.FORGET_PASSWORD);
        return;
      }

      const secret = AuthSecrets.JWT + password_from_database;
      const payload = {
        id: enrollment,
        email: email_from_database,
      };
      const token = jwt.sign(payload, secret, {
        expiresIn: TokenConfig.EXPIRES_IN,
      });
      const link = `${appBaseUrl()}${Routes.RESET_PASSWORD}/${enrollment}/${token}`;
      var mailOptions = {
        from:
          process.env.MAIL_FROM ||
          process.env.SMTP_USER ||
          process.env.EMAIL_USER,
        to: email,
        subject: EmailTemplates.FORGOT_SUBJECT,
        text: EmailTemplates.FORGOT_BODY(link),
      };
      transport.sendMail(mailOptions, function (error, info) {
        if (error) {
          req.flash(FlashKeys.MESSAGE, FlashMessages.EMAIL_SEND_FAILED_GMAIL);
          res.redirect(Routes.FORGET_PASSWORD);
        } else {
          req.flash(FlashKeys.MESSAGE, FlashMessages.AUTH_MAIL_SENT);
          res.redirect(Routes.FORGET_PASSWORD);
        }
      });
  });
});

router.get("/reset-password/:id/:token", async (req, res, next) => {
  const { id, token } = req.params;
  if (id != enrollment) {
    req.flash(FlashKeys.MESSAGE, FlashMessages.INVALID);
    return res.redirect(Routes.FORGET_PASSWORD);
  }

  const secret = AuthSecrets.JWT + password_from_database;

  try {
    jwt.verify(token, secret);
    res.render(ViewNames.RESET_PASSWORD, { id: id, token: token });
  } catch (error) {
    req.flash(FlashKeys.MESSAGE, FlashMessages.INVALID);
    res.redirect(Routes.FORGET_PASSWORD);
  }
});

router.post("/reset-password/:id/:token", async (req, res, next) => {
  const id = req.params.id;
  const token = req.params.token;

  const password = req.body[FormFields.PASSWORD];
  const confirm_password = req.body.confirm_password;

  if (id != enrollment) {
    req.flash(FlashKeys.MESSAGE, FlashMessages.INVALID);
    return res.redirect(Routes.FORGET_PASSWORD);
  }

  if (password != confirm_password) {
    req.flash(FlashKeys.MESSAGE, FlashMessages.ENTER_CORRECT_PASSWORD);
    return res.redirect(`${Routes.RESET_PASSWORD}/${id}/${token}`);
  }

  const secret = AuthSecrets.JWT + password_from_database;
  try {
    jwt.verify(token, secret);

    var new_pass = crypt.encrypt(req.body.confirm_password);

    var sql = `update stockuser set password='${new_pass}' where username='${enrollment}'`;

    db.query(sql, function (err, result) {
      if (err) {
        req.flash(FlashKeys.MESSAGE, FlashMessages.SOME_ERROR);
        res.redirect(`${Routes.RESET_PASSWORD}/${id}/${token}`);
      } else {
        req.flash(FlashKeys.MESSAGE, FlashMessages.PASSWORD_CHANGED);
        res.redirect(Routes.LOGIN);
      }
    });
  } catch (error) {
    req.flash(FlashKeys.MESSAGE, FlashMessages.INVALID);
    res.redirect(Routes.FORGET_PASSWORD);
  }
});

module.exports = router;
