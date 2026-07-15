const jwt = require("jsonwebtoken");
const db = require("../services/db");
const { sendMail } = require("../services/mailService");
const { registrationEmail } = require("../mailer/emailTemplates");
const crypt = require("../utils/crypt");
const { verifyUser } = require("../middleware/verifyUser");
const {
  AuthSecrets,
  TokenConfig,
  Routes,
  ViewNames,
  FlashKeys,
  FlashMessages,
  FormFields,
  RegistrationDefaults,
  appBaseUrl,
} = require("../constants/enums");

function renderRegister(req, res) {
  res.render(ViewNames.REGISTER, { message: req.flash(FlashKeys.MESSAGE) });
}

function postRegister(req, res) {
  const username = req.body[FormFields.ID];
  const name = req.body[FormFields.FULL_NAME];
  const email = req.body[FormFields.EMAIL];
  if (!username || !name || !email) {
    req.flash(FlashKeys.MESSAGE, FlashMessages.FILL_REQUIRED);
    return res.redirect(Routes.LOGIN);
  }

  db.query("SELECT username FROM stockuser WHERE username = ?", [username], async (err, rows) => {
    if (err) {
      req.flash(FlashKeys.MESSAGE, FlashMessages.REGISTRATION_FAILED);
      return res.redirect(Routes.LOGIN);
    }
    if (rows.length > 0) {
      req.flash(FlashKeys.MESSAGE, FlashMessages.ID_ALREADY_REGISTERED(username));
      return res.redirect(Routes.LOGIN);
    }

    const token = jwt.sign({ id: username, email, name }, AuthSecrets.JWT + username, {
      expiresIn: TokenConfig.EXPIRES_IN,
    });
    const link = `${appBaseUrl()}${Routes.REGISTER_COMP}/${encodeURIComponent(username)}/${encodeURIComponent(email)}/${token}`;
    try {
      const mail = registrationEmail({ link, name });
      await sendMail({
        from: process.env.MAIL_FROM || process.env.SMTP_USER || process.env.EMAIL_USER,
        to: email,
        subject: mail.subject,
        text: mail.text,
        html: mail.html,
      });
      req.flash(FlashKeys.MESSAGE, FlashMessages.AUTH_LINK_SENT);
    } catch (error) {
      req.flash(FlashKeys.MESSAGE, FlashMessages.EMAIL_SEND_FAILED);
    }
    res.redirect(Routes.LOGIN);
  });
}

function confirmRegister(req, res) {
  const { id, token } = req.params;
  try {
    jwt.verify(token, AuthSecrets.JWT + id);
    res.render(ViewNames.CONFIRM_REGISTER, { id, token });
  } catch (error) {
    req.flash(FlashKeys.MESSAGE, FlashMessages.INVALID_REG_LINK);
    res.redirect(Routes.LOGIN);
  }
}

function renderRegisterComp(req, res) {
  const { id, email, token } = req.params;
  try {
    const payload = jwt.verify(token, AuthSecrets.JWT + id);
    if (payload.id !== id) {
      req.flash(FlashKeys.MESSAGE, FlashMessages.INVALID_REG_LINK_SHORT);
      return res.redirect(Routes.LOGIN);
    }
    res.render(ViewNames.REGISTER_COMP, { id, email, token });
  } catch (error) {
    req.flash(
      FlashKeys.MESSAGE,
      error.name === "TokenExpiredError"
        ? FlashMessages.REG_LINK_EXPIRED
        : FlashMessages.INVALID_REG_LINK
    );
    res.redirect(Routes.LOGIN);
  }
}

function postRegisterComp(req, res) {
  const id = decodeURIComponent(req.params.id);
  const email = decodeURIComponent(req.params.email);
  const token = req.params.token;
  try {
    const payload = jwt.verify(token, AuthSecrets.JWT + id);
    const displayName = payload.name || id;
    const values = [
      id,
      displayName,
      email,
      req.body[FormFields.MOBILE_NO],
      req.body[FormFields.DOB],
      req.body[FormFields.AMOUNT],
      crypt.encrypt(req.body[FormFields.PASS]),
      RegistrationDefaults.PROFIT,
      RegistrationDefaults.LOSS,
    ];
    db.query(
      "INSERT INTO stockuser (username, name, email, mobNo, dob, amount, password, profit, loss) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
      values,
      (err) => {
        if (err) {
          req.flash(
            FlashKeys.MESSAGE,
            err.code === "ER_DUP_ENTRY"
              ? FlashMessages.ID_ALREADY_REGISTERED(id)
              : FlashMessages.REGISTRATION_FAILED
          );
          return res.redirect(Routes.LOGIN);
        }
        req.flash(FlashKeys.MESSAGE, FlashMessages.REGISTERED_SUCCESS);
        res.redirect(Routes.LOGIN);
      }
    );
  } catch (error) {
    req.flash(
      FlashKeys.MESSAGE,
      error.name === "TokenExpiredError"
        ? FlashMessages.REG_LINK_EXPIRED
        : FlashMessages.INVALID_REG_LINK
    );
    res.redirect(Routes.LOGIN);
  }
}

function getChangeProfile(req, res) {
  res.render(ViewNames.CHANGE_PROFILE, { message: req.flash(FlashKeys.MESSAGE) });
}

function postChangeProfile(req, res) {
  const image = req.file.filename;
  const sql = `update links set profile_pic='${image}' where username='${req.user.username}'`;
  db.query(sql, (err) => {
    if (err) {
      req.flash(FlashKeys.MESSAGE, FlashMessages.UNABLE_TO_RESET);
      res.redirect(ViewNames.CHANGE_PROFILE);
      return;
    }
    res.render(ViewNames.USER_LAND);
  });
}

module.exports = {
  renderRegister,
  postRegister,
  confirmRegister,
  renderRegisterComp,
  postRegisterComp,
  getChangeProfile,
  postChangeProfile: [verifyUser, postChangeProfile],
};
