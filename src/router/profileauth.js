const express = require("express");
var db = require("../database/db");
const middlewares = require("../middleware/verifyUser");
const router = express.Router();
const {
  ViewNames,
  Routes,
  FlashMessages,
} = require("../constants/enums");

router.get("/profileView", middlewares.requireUser, async (req, res) => {
  const username = req.user.username;
  db.query(
    "SELECT username, name, email, mobNo, amount, profit, loss FROM stockuser WHERE username = ?",
    [username],
    (error, rows) => {
      if (error || !rows || !rows[0]) {
        return res.render(ViewNames.PROFILE_VIEW, {
          user: req.user,
          error: error ? FlashMessages.DB_ERROR : FlashMessages.USERNAME_NOT_EXIST,
        });
      }
      res.render(ViewNames.PROFILE_VIEW, {
        user: rows[0],
        message: req.query.message,
        error: req.query.error,
      });
    }
  );
});

router.get("/transactionHistory", middlewares.requireUser, (req, res) => {
  const username = req.user.username;
  var sql = `select * from transactionHistory where username=?`;
  db.query(sql, [username], (error, result) => {
    res.render(ViewNames.TRANSACTION_HISTORY, {
      result: error ? [] : result || [],
      error: error ? FlashMessages.DB_ERROR : req.query.error,
      message: error ? null : req.query.message,
    });
  });
});

router.get("/autoSellView", middlewares.requireUser, (req, res) => {
  const username = req.user.username;
  var sql = `select * from autoSell where username=?`;
  db.query(sql, [username], (error, result) => {
    if (error) {
      return res.render(ViewNames.AUTO_SELL_VIEW, {
        result: [],
        error: FlashMessages.TRY_AGAIN,
      });
    }
    res.render(ViewNames.AUTO_SELL_VIEW, {
      result: result || [],
      error: req.query.error,
    });
  });
});

router.get("/deleteAutoBuy", middlewares.requireUser, (req, res) => {
  var username = req.user.username;
  var id = req.query.id;
  var selected_price = req.query.selected_price;

  if (!id || selected_price === undefined) {
    return res.redirect(
      `${Routes.AUTO_BUY_VIEW}?error=${encodeURIComponent(FlashMessages.TRY_AGAIN)}`
    );
  }

  var sql = `delete from autoBuy where id=? and username=? and selected_price=?`;
  db.query(sql, [id, username, selected_price], (error) => {
    if (error) {
      return res.redirect(
        `${Routes.AUTO_BUY_VIEW}?error=${encodeURIComponent(FlashMessages.TRY_AGAIN)}`
      );
    }
    res.redirect(Routes.AUTO_BUY_VIEW);
  });
});

router.get("/autoBuyView", middlewares.requireUser, (req, res) => {
  const username = req.user.username;
  var sql = `select * from autoBuy where username=?`;
  db.query(sql, [username], (error, result) => {
    if (error) {
      return res.redirect(
        `${Routes.AUTO_BUY_VIEW}?error=${encodeURIComponent(FlashMessages.TRY_AGAIN)}`
      );
    }
    res.render(ViewNames.AUTO_BUY_VIEW, {
      result: result || [],
      error: req.query.error,
    });
  });
});

router.get("/deleteAutoSell", middlewares.requireUser, (req, res) => {
  var username = req.user.username;
  var id = req.query.id;
  var selected_price = req.query.selected_price;

  if (!id || selected_price === undefined) {
    return res.redirect(
      `${Routes.AUTO_SELL_VIEW}?error=${encodeURIComponent(FlashMessages.TRY_AGAIN)}`
    );
  }

  var sql = `delete from autoSell where id=? and username=? and selected_price=?`;
  db.query(sql, [id, username, selected_price], (error) => {
    if (error) {
      return res.redirect(
        `${Routes.AUTO_SELL_VIEW}?error=${encodeURIComponent(FlashMessages.TRY_AGAIN)}`
      );
    }
    res.redirect(Routes.AUTO_SELL_VIEW);
  });
});

module.exports = router;
