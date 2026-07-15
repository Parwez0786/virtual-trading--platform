const express = require("express");
var con = require("../database/db");
const router = express.Router();
var global_enrollment;

const jwt = require("jsonwebtoken");
const crypt = require("../utils/crypt");
const middlewares = require("../utils/verifyUser.js");
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

router.get("/login", (req, res) => {
  res.render(ViewNames.LOGIN, {
    message: req.flash(FlashKeys.MESSAGE),
  });
});

router.get("/user_land", middlewares.verifyUser, async (req, res) => {
  try {
    var sql = `SELECT * FROM student_data where enroll_no="${req.user.enroll_no}" `;
    con.query(sql, (error, result) => {
      if (error) {
        req.flash(FlashKeys.MESSAGE, FlashMessages.DB_ERROR);
        return res.redirect(Routes.LOGIN);
      }
      res.render(ViewNames.USER_LAND, {
        results: result,
      });
    });
  } catch (error) {
    req.flash(FlashKeys.MESSAGE, FlashMessages.TRY_AGAIN);
    res.redirect(Routes.LOGIN);
  }
});

router.get("/get_data2", middlewares.verifyUser, (req, res, next) => {
  try {
    var id = req.query.id;
    var sql = `select * from student_data t1, description t2, links t3 where t1.enroll_no = t2.enroll_no and t2.enroll_no = t3.enroll_no and t1.enroll_no = "${req.user.enroll_no}";`;
    con.query(sql, [id], (error, result) => {
      if (error) {
        return res.status(500).json({ error: FlashMessages.DB_ERROR });
      }
      res.json(result);
    });
  } catch (error) {
    res.status(500).json({ error: FlashMessages.TRY_AGAIN });
  }
});

router.post("/login", (req, res) => {
  var user = req.body[FormFields.CUST_ID];
  var name;

  if (user.length == 0) {
    req.flash(FlashKeys.MESSAGE, FlashMessages.ENTER_CUSTID);
    res.redirect(ViewNames.LOGIN);
  } else {
    var pass = req.body[FormFields.PASSWORD];

    var sql = `select * from stockuser where  username="${user}"`;

    con.query(sql, function (err, result) {
      if (err) {
        req.flash(FlashKeys.MESSAGE, FlashMessages.USERNAME_PASSWORD_MISMATCH);
        return res.redirect(ViewNames.LOGIN);
      } else {
        if (result[0]) {
          name = result[0].name;
          if (result.length == 0) {
            req.flash(FlashKeys.MESSAGE, FlashMessages.VALID_ENROLL);
            res.redirect(ViewNames.LOGIN);
          } else {
            let gg = crypt.decrypt(result[0].password);
            if (gg.localeCompare(pass) == 0) {
              let token = jwt.sign(result[0], AuthSecrets.JWT);
              res
                .cookie(
                  CookieNames.ACCESS_TOKEN,
                  token,
                  CookieOptions.ACCESS_TOKEN
                )
                .redirect(Routes.STOCK_HOME);
            } else {
              global_enroll = user;
              req.flash(FlashKeys.MESSAGE, FlashMessages.VALID_PASSWORD);
              res.redirect(ViewNames.LOGIN);
            }
          }
        } else {
          req.flash(FlashKeys.MESSAGE, FlashMessages.USERNAME_NOT_EXIST);
          res.redirect(ViewNames.LOGIN);
        }
      }
    });
  }
});

router.get("/deleteAccountForm", (req, res) => {
  var errorMessage = req.query[FlashKeys.ERROR_MESSAGE];
  res.render(ViewNames.DELETE, {
    errorMessage,
  });
});

router.post("/deleteUserAccount", (req, res) => {
  var username = req.body[FormFields.USER_ID];
  var password = req.body[FormFields.PASSWORD];
  var sql = `select * from stockuser where username='${username}'`;
  con.query(sql, (error, result) => {
    if (error) {
      return res.redirect(
        `/api/loginauth/deleteAccountForm?errorMessage=${encodeURIComponent(
          FlashMessages.ACCOUNT_DELETE_FAILED
        )}`
      );
    } else {
      if (result[0]) {
        let gg = crypt.decrypt(result[0].password);
        if (gg.localeCompare(password) == 0) {
          var sql = `delete from wishlist where username='${username}'`;
          con.query(sql, (error, result) => {
            if (error) {
              return res.redirect(
                `/api/loginauth/deleteAccountForm?errorMessage=${encodeURIComponent(
                  FlashMessages.ACCOUNT_DELETE_FAILED
                )}`
              );
            } else {
              var sql = `delete from autoSell where username='${username}'`;
              con.query(sql, (error, result) => {
                if (error) {
                  return res.redirect(
                    `/api/loginauth/deleteAccountForm?errorMessage=${encodeURIComponent(
                      FlashMessages.ACCOUNT_DELETE_FAILED
                    )}`
                  );
                } else {
                  var sql = `delete from reviews where username='${username}'`;
                  con.query(sql, (error, result) => {
                    if (error) {
                      return res.redirect(
                        `/api/loginauth/deleteAccountForm?errorMessage=${encodeURIComponent(
                          FlashMessages.ACCOUNT_DELETE_FAILED
                        )}`
                      );
                    } else {
                      var sql = `delete from transactionHistory where username='${username}'`;
                      con.query(sql, (error, result) => {
                        if (error) {
                          return res.redirect(
                            `/api/loginauth/deleteAccountForm?errorMessage=${encodeURIComponent(
                              FlashMessages.ACCOUNT_DELETE_FAILED
                            )}`
                          );
                        } else {
                          var sql = `delete from userStocks where username='${username}'`;
                          con.query(sql, (error, result) => {
                            if (error) {
                              return res.redirect(
                                `/api/loginauth/deleteAccountForm?errorMessage=${encodeURIComponent(
                                  FlashMessages.ACCOUNT_DELETE_FAILED
                                )}`
                              );
                            } else {
                              var sql = `delete from autoBuy where username='${username}'`;
                              con.query(sql, (error, result) => {
                                if (error) {
                                  return res.redirect(
                                    `/api/loginauth/deleteAccountForm?errorMessage=${encodeURIComponent(
                                      FlashMessages.ACCOUNT_DELETE_FAILED
                                    )}`
                                  );
                                } else {
                                  var sql = `delete from stockuser where username='${username}'`;
                                  con.query(sql, (error, result) => {
                                    if (error) {
                                      return res.redirect(
                                        `/api/loginauth/deleteAccountForm?errorMessage=${encodeURIComponent(
                                          FlashMessages.ACCOUNT_DELETE_FAILED
                                        )}`
                                      );
                                    } else {
                                      res.redirect(
                                        `/api/loginauth/deleteAccountForm?errorMessage=${encodeURIComponent(
                                          TradeMessages.ACCOUNT_DELETED
                                        )}`
                                      );
                                    }
                                  });
                                }
                              });
                            }
                          });
                        }
                      });
                    }
                  });
                }
              });
            }
          });
        } else {
          res.redirect(
            `/api/loginauth/deleteAccountForm?errorMessage=${encodeURIComponent(
              TradeMessages.INCORRECT_PASSWORD
            )}`
          );
        }
      } else {
        res.redirect(
          `/api/loginauth/deleteAccountForm?errorMessage=${encodeURIComponent(
            TradeMessages.USER_ID_NOT_EXIST
          )}`
        );
      }
    }
  });
});

module.exports = router;
