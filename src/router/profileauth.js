const express = require("express");
var db = require("../database/db");
const jwt = require("jsonwebtoken");
const middlewares = require("../utils/verifyUser.js");
const router = express.Router();
const {
  ViewNames,
  Routes,
  DemoUser,
  FlashMessages,
} = require("../constants/enums");

router.get("/profileView", async (req, res, next) => {
  res.render(ViewNames.PROFILE_VIEW);
});

router.get("/transactionHistory", (req, res) => {
  const username = (req.user && req.user.username) || DemoUser.USERNAME;
  var sql = `select * from transactionHistory where username='${username}'`;
  db.query(sql, (error, result) => {
    res.render(ViewNames.TRANSACTION_HISTORY, { result });
  });
});

router.get("/autoSellView", (req, res) => {
  const username = (req.user && req.user.username) || DemoUser.USERNAME;
  var sql = `select * from autoSell where username='${username}'`;
  db.query(sql, (error, result) => {
    if (error) {
      return res.render(ViewNames.AUTO_SELL_VIEW, {
        result: [],
        error: FlashMessages.TRY_AGAIN,
      });
    }
    res.render(ViewNames.AUTO_SELL_VIEW, { result, error: req.query.error });
  });
});

router.get("/deleteAutoBuy", (req, res) => {
  var username = req.query.username;
  var id = req.query.id;
  var selected_price = req.query.selected_price;

  var sql = `delete from autoBuy where id='${id}' and username='${username}' and selected_price=${selected_price}`;
  db.query(sql, (error, result) => {
    if (error) {
      return res.render(ViewNames.AUTO_BUY_VIEW, {
        result: [],
        error: FlashMessages.TRY_AGAIN,
      });
    }
    res.redirect(Routes.AUTO_BUY_VIEW);
  });
});

router.get("/autoBuyView", (req, res) => {
  const username = (req.user && req.user.username) || DemoUser.USERNAME;
  var sql = `select * from autoBuy where username='${username}'`;
  db.query(sql, (error, result) => {
    if (error) {
      return res.redirect(
        `${Routes.AUTO_BUY_VIEW}?error=${encodeURIComponent(FlashMessages.TRY_AGAIN)}`
      );
    }
    res.render(ViewNames.AUTO_BUY_VIEW, { result, error: req.query.error });
  });
});

router.get("/deleteAutoSell", (req, res) => {
  var username = req.query.username;
  var id = req.query.id;
  var selected_price = req.query.selected_price;

  var sql = `delete from autoSell where id='${id}' and username='${username}' and selected_price=${selected_price}`;
  db.query(sql, (error, result) => {
    if (error) {
      return res.redirect(
        `${Routes.AUTO_SELL_VIEW}?error=${encodeURIComponent(FlashMessages.TRY_AGAIN)}`
      );
    }
    res.redirect(Routes.AUTO_SELL_VIEW);
  });
});

module.exports = router;
