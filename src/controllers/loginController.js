const jwt = require("jsonwebtoken");
const db = require("../services/db");
const crypt = require("../utils/crypt");
const { verifyUser } = require("../middleware/verifyUser");
const { findStockUserByUsername, deleteUserCascade } = require("../services/userService");
const {
  AuthSecrets,
  CookieNames,
  CookieOptions,
  Routes,
  ViewNames,
  FlashKeys,
  FlashMessages,
  TradeMessages,
  FormFields,
} = require("../constants/enums");

function renderLogin(req, res) {
  res.render(ViewNames.LOGIN, { message: req.flash(FlashKeys.MESSAGE) });
}

function userLand(req, res) {
  try {
    const sql = `SELECT * FROM student_data where enroll_no="${req.user.enroll_no}" `;
    db.query(sql, (error, result) => {
      if (error) {
        req.flash(FlashKeys.MESSAGE, FlashMessages.DB_ERROR);
        return res.redirect(Routes.LOGIN);
      }
      res.render(ViewNames.USER_LAND, { results: result });
    });
  } catch (error) {
    req.flash(FlashKeys.MESSAGE, FlashMessages.TRY_AGAIN);
    res.redirect(Routes.LOGIN);
  }
}

function getData2(req, res) {
  try {
    const id = req.query.id;
    const sql = `select * from student_data t1, description t2, links t3 where t1.enroll_no = t2.enroll_no and t2.enroll_no = t3.enroll_no and t1.enroll_no = "${req.user.enroll_no}";`;
    db.query(sql, [id], (error, result) => {
      if (error) return res.status(500).json({ error: FlashMessages.DB_ERROR });
      res.json(result);
    });
  } catch (error) {
    res.status(500).json({ error: FlashMessages.TRY_AGAIN });
  }
}

function postLogin(req, res) {
  const user = req.body[FormFields.CUST_ID];
  if (user.length === 0) {
    req.flash(FlashKeys.MESSAGE, FlashMessages.ENTER_CUSTID);
    return res.redirect(ViewNames.LOGIN);
  }

  const pass = req.body[FormFields.PASSWORD];
  findStockUserByUsername(user)
    .then((result) => {
      if (!result[0]) {
        req.flash(FlashKeys.MESSAGE, FlashMessages.USERNAME_NOT_EXIST);
        return res.redirect(ViewNames.LOGIN);
      }
      if (result.length === 0) {
        req.flash(FlashKeys.MESSAGE, FlashMessages.VALID_ENROLL);
        return res.redirect(ViewNames.LOGIN);
      }
      if (crypt.decrypt(result[0].password).localeCompare(pass) === 0) {
        const token = jwt.sign(result[0], AuthSecrets.JWT);
        return res
          .cookie(CookieNames.ACCESS_TOKEN, token, CookieOptions.ACCESS_TOKEN)
          .redirect(Routes.STOCK_HOME);
      }
      req.flash(FlashKeys.MESSAGE, FlashMessages.VALID_PASSWORD);
      return res.redirect(ViewNames.LOGIN);
    })
    .catch(() => {
      req.flash(FlashKeys.MESSAGE, FlashMessages.USERNAME_PASSWORD_MISMATCH);
      res.redirect(ViewNames.LOGIN);
    });
}

function deleteAccountForm(req, res) {
  res.render(ViewNames.DELETE, { errorMessage: req.query[FlashKeys.ERROR_MESSAGE] });
}

async function deleteUserAccount(req, res) {
  const username = req.body[FormFields.USER_ID];
  const password = req.body[FormFields.PASSWORD];
  const redirect = (message) =>
    res.redirect(
      `/api/loginauth/deleteAccountForm?errorMessage=${encodeURIComponent(message)}`
    );

  try {
    const result = await findStockUserByUsername(username);
    if (!result[0]) return redirect(TradeMessages.USER_ID_NOT_EXIST);
    if (crypt.decrypt(result[0].password).localeCompare(password) !== 0) {
      return redirect(TradeMessages.INCORRECT_PASSWORD);
    }
    await deleteUserCascade(username);
    redirect(TradeMessages.ACCOUNT_DELETED);
  } catch (error) {
    redirect(FlashMessages.ACCOUNT_DELETE_FAILED);
  }
}

module.exports = {
  renderLogin,
  postLogin,
  userLand: [verifyUser, userLand],
  getData2: [verifyUser, getData2],
  deleteAccountForm,
  deleteUserAccount,
};
