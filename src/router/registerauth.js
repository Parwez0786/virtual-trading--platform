const express = require("express");
var db = require("../database/db");
const router = express.Router();
const jwt = require("jsonwebtoken");
const transport = require("../mailer/mailsend");
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
  RegistrationDefaults,
  appBaseUrl,
} = require("../constants/enums");

var username;
var Name;

var city;
var email;
var mobNo;

var dob;
var amount;
var pass;

router.get("/register", async (req, res, next) => {
  res.render(ViewNames.REGISTER, { message: req.flash(FlashKeys.MESSAGE) });
});

router.post("/register", async (req, res, next) => {
  username = req.body[FormFields.ID];
  Name = req.body[FormFields.FULL_NAME];
  email = req.body[FormFields.EMAIL];

  if (!username || !Name || !email) {
    req.flash(FlashKeys.MESSAGE, FlashMessages.FILL_REQUIRED);
    return res.redirect(Routes.LOGIN);
  }

  db.query(
    "SELECT username FROM stockuser WHERE username = ?",
    [username],
    function (err, rows) {
      if (err) {
        req.flash(FlashKeys.MESSAGE, FlashMessages.REGISTRATION_FAILED);
        return res.redirect(Routes.LOGIN);
      }
      if (rows.length > 0) {
        req.flash(
          FlashKeys.MESSAGE,
          FlashMessages.ID_ALREADY_REGISTERED(username)
        );
        return res.redirect(Routes.LOGIN);
      }

      const secret = AuthSecrets.JWT + username;
      const payload = {
        id: username,
        email: email,
        name: Name,
      };
      const token = jwt.sign(payload, secret, {
        expiresIn: TokenConfig.EXPIRES_IN,
      });
      const link = `${appBaseUrl()}${Routes.REGISTER_COMP}/${encodeURIComponent(
        username
      )}/${encodeURIComponent(email)}/${token}`;

      const mailOptions = {
        from:
          process.env.MAIL_FROM ||
          process.env.SMTP_USER ||
          process.env.EMAIL_USER,
        to: email,
        subject: EmailTemplates.CONFIRM_SUBJECT,
        text: EmailTemplates.CONFIRM_BODY(link),
      };

      transport.sendMail(mailOptions, function (error, info) {
        if (error) {
          req.flash(FlashKeys.MESSAGE, FlashMessages.EMAIL_SEND_FAILED);
          res.redirect(Routes.LOGIN);
        } else {
          req.flash(FlashKeys.MESSAGE, FlashMessages.AUTH_LINK_SENT);
          res.redirect(Routes.LOGIN);
        }
      });
    }
  );
});

router.get("/confirm_register/:id/:token", async (req, res, next) => {
  const { id, token } = req.params;
  if (id != username) {
    res.send(FlashMessages.INVALID);
    return;
  }

  const secret = AuthSecrets.JWT + pass;

  try {
    const payload = jwt.verify(token, secret);
    res.render(ViewNames.CONFIRM_REGISTER, { id: id, token: token });
  } catch (error) {
    req.flash(FlashKeys.MESSAGE, FlashMessages.INVALID_REG_LINK);
    res.redirect(Routes.LOGIN);
  }
});

router.get("/register_comp/:id/:email/:token", async (req, res, next) => {
  const { id, email, token } = req.params;
  const secret = AuthSecrets.JWT + id;

  try {
    const payload = jwt.verify(token, secret);
    if (payload.id !== id) {
      req.flash(FlashKeys.MESSAGE, FlashMessages.INVALID_REG_LINK_SHORT);
      return res.redirect(Routes.LOGIN);
    }
    Name = payload.name || Name;
    username = id;
    res.render(ViewNames.REGISTER_COMP, { id: id, email: email, token: token });
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      req.flash(FlashKeys.MESSAGE, FlashMessages.REG_LINK_EXPIRED);
    } else {
      req.flash(FlashKeys.MESSAGE, FlashMessages.INVALID_REG_LINK);
    }
    res.redirect(Routes.LOGIN);
  }
});

router.post(
  "/register_comp/:id/:email/:token",
  async (req, res, next) => {
    const id = decodeURIComponent(req.params.id);
    const email = decodeURIComponent(req.params.email);
    const token = req.params.token;
    const secret = AuthSecrets.JWT + id;

    try {
      const payload = jwt.verify(token, secret);
      const displayName = payload.name || Name || id;

      username = id;
      Name = displayName;
      mobNo = req.body[FormFields.MOBILE_NO];
      dob = req.body[FormFields.DOB];
      const cipher = crypt.encrypt(req.body[FormFields.PASS]);
      amount = req.body[FormFields.AMOUNT];

      const sql =
        "INSERT INTO stockuser (username, name, email, mobNo, dob, amount, password, profit, loss) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)";
      const values = [
        username,
        displayName,
        email,
        mobNo,
        dob,
        amount,
        cipher,
        RegistrationDefaults.PROFIT,
        RegistrationDefaults.LOSS,
      ];

      db.query(sql, values, function (err, result) {
        if (err) {
          if (err.code === "ER_DUP_ENTRY") {
            req.flash(
              FlashKeys.MESSAGE,
              FlashMessages.ID_ALREADY_REGISTERED(username)
            );
          } else {
            req.flash(FlashKeys.MESSAGE, FlashMessages.REGISTRATION_FAILED);
          }
          return res.redirect(Routes.LOGIN);
        }

        req.flash(FlashKeys.MESSAGE, FlashMessages.REGISTERED_SUCCESS);
        res.redirect(Routes.LOGIN);
      });
    } catch (error) {
      if (error.name === "TokenExpiredError") {
        req.flash(FlashKeys.MESSAGE, FlashMessages.REG_LINK_EXPIRED);
      } else {
        req.flash(FlashKeys.MESSAGE, FlashMessages.INVALID_REG_LINK);
      }
      res.redirect(Routes.LOGIN);
    }
  }
);

router.get("/changeProfile", async (req, res, next) => {
  res.render(ViewNames.CHANGE_PROFILE, {
    message: req.flash(FlashKeys.MESSAGE),
  });
});

const middlewares = require("../utils/verifyUser.js");
router.post(
  "/changeProfile",
  middlewares.verifyUser,
 
  async (req, res, next) => {
    var image = req.file.filename;

    var sql = `update links set profile_pic='${image}' where username='${req.user.username}'`;
    db.query(sql, function (err, result) {
      if (err) {
        req.flash(FlashKeys.MESSAGE, FlashMessages.UNABLE_TO_RESET);
        res.redirect(ViewNames.CHANGE_PROFILE);
      } else {
        res.render(ViewNames.USER_LAND);
      }
    });
  }
);

module.exports = router;
