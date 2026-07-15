const express = require("express");
var con = require("../database/db");
const router = express.Router();
const middlewares = require("../utils/verifyUser.js");
const fetch = require("node-fetch");
const {
  use
} = require("passport");

const crypt = require("../utils/crypt");
const {
  Routes,
  ViewNames,
  TradeMessages,
  FlashMessages,
  StockIndexes,
  StockIdentifiers,
  rapidPriceUrl,
  rapidHeaders,
} = require("../constants/enums");

router.get("/sellStocks", async (req, res) => {
  var id = req.query.id;
  var message = req.query.error;

  res.render(ViewNames.SELL_STOCKS, {
    id,
    message
  });
});

const getPriceNew = async (row) => {
  try {
    row += StockIdentifiers.EQN_SUFFIX;
    const response = await fetch(
      rapidPriceUrl(StockIndexes.NIFTY_200, row), {
        headers: rapidHeaders(),
      }
    );

    const data = await response.json();
    return data[0].lastPrice;
  } catch (err) {
    return undefined;
  }
};
router.post("/sellStock", async (req, res) => {
  var unit = req.body.units;
  var stockId = req.body.stockid;
  var username = req.body.username;

  var password = req.body.password;
  var total_amount_invested_in_that_stock = 0;
  var net_profit = 0;
  var net_loss = 0;
  var units_in_database = 0;
  var original_amount_in_stockuser;
  var orginalprofit = 0;
  var originalloss = 0;

  const sql = `select * from  userStocks where username='${username}' and id='${stockId}'`;

  con.query(sql, async (error, result) => {
    if (error) {
      return res.redirect(
        `/api/sell/sellStocks?id=${stockId}&error=` +
        encodeURIComponent(TradeMessages.UNEXPECTED_ERROR)
      );
    } else {
      if (result[0]) {
        if (result[0].units >= unit) {
          units_in_database = result[0].units;
          total_amount_invested_in_that_stock = result[0].amt_invested;

          const sql1 = `select * from  stockuser where username='${username}'`;
          con.query(sql1, async (error, result) => {
            if (error) {
              res.redirect(
                `/api/sell/sellStocks?id=${stockId}&error=` +
                encodeURIComponent(TradeMessages.INVALID_CREDENTIAL)
              );

            } else {
              originalloss = result[0].loss;
              orginalprofit = result[0].profit;

              let gg = crypt.decrypt(result[0].password);
              if (gg.localeCompare(password) == 0) {
                original_amount_in_stockuser = result[0].amount;

                if (units_in_database == unit) {
                  var currentPrice = await getPriceNew(stockId);
                  var currentValue = unit * currentPrice;

                  if (currentValue >= total_amount_invested_in_that_stock) {
                    net_profit =
                      net_profit +
                      currentValue -
                      total_amount_invested_in_that_stock;
                  } else {
                    net_loss =
                      net_loss +
                      total_amount_invested_in_that_stock -
                      currentValue;
                  }
                  if (net_profit >= 0) {
                    orginalprofit = orginalprofit + net_profit;
                  }
                  if (net_loss >= 0) {
                    originalloss = originalloss + net_loss;
                  }

                  original_amount_in_stockuser =
                    original_amount_in_stockuser + currentValue;

                  const sql3 = `update stockuser set amount=${original_amount_in_stockuser}, profit=${orginalprofit}, loss=${originalloss} where username="${username}"`;
                  con.query(sql3, async (error, result) => {
                    if (error) {
                      return res.redirect(
                        `/api/sell/sellStocks?id=${stockId}&error=${encodeURIComponent(
                          TradeMessages.UNEXPECTED_ERROR
                        )}`
                      );
                    } else {
                      res.redirect(
                        `/api/sell/sellStocks?id=${stockId}&error=` +
                        encodeURIComponent(TradeMessages.SUCCESSFULLY_SOLD)
                      );
                    }
                  });

                  const sql5 = `delete from userStocks where id='${stockId}'`;
                  con.query(sql5, async (error, result) => {
                    if (error) {
                      return;
                    }
                  });
                } else {
                  var currentPrice = await getPriceNew(stockId);
                  var currentValue = unit * currentPrice;
                  var new_units = units_in_database - unit;
                  var totalamount_investifor_entered_unit =
                    (total_amount_invested_in_that_stock * unit) /
                    units_in_database;
                  var new_total_amount_invested =
                    total_amount_invested_in_that_stock -
                    (total_amount_invested_in_that_stock * unit) /
                    units_in_database;

                  if (currentValue >= totalamount_investifor_entered_unit) {
                    net_profit =
                      net_profit +
                      currentValue -
                      totalamount_investifor_entered_unit;
                  } else {
                    net_loss =
                      net_loss +
                      totalamount_investifor_entered_unit -
                      currentValue;
                  }

                  if (net_profit >= 0) {
                    orginalprofit = orginalprofit + net_profit;
                  }
                  if (net_loss >= 0) {
                    originalloss = originalloss + net_loss;
                  }

                  original_amount_in_stockuser =
                    original_amount_in_stockuser + currentValue;

                  const sql2 = `update userStocks set units=${new_units}, amt_invested=${new_total_amount_invested} where username="${username}" and id="${stockId}"`;
                  con.query(sql2, async (error, result) => {
                    if (error) {
                      return res.redirect(
                        `/api/sell/sellStocks?id=${stockId}&error=${encodeURIComponent(
                          TradeMessages.UNEXPECTED_ERROR
                        )}`
                      );
                    } else {
                      const sql3 = `update stockuser set amount=${original_amount_in_stockuser},  profit=${orginalprofit}, loss=${originalloss} where username="${username}"`;
                      con.query(sql3, async (error, result) => {
                        if (error) {
                          return res.redirect(
                            `/api/sell/sellStocks?id=${stockId}&error=${encodeURIComponent(
                              TradeMessages.UNEXPECTED_ERROR
                            )}`
                          );
                        } else {
                          res.redirect(
                            `/api/sell/sellStocks?id=${stockId}&error=` +
                            encodeURIComponent(TradeMessages.SUCCESSFULLY_SOLD_TYPO)
                          );
                        }
                      });
                    }
                  });
                }
              } else {
                res.redirect(
                  `/api/sell/sellStocks?id=${stockId}&error=` +
                  encodeURIComponent(TradeMessages.INVALID_PASSWORD)
                );
              }
            }
          });
        } else {
          res.redirect(
            `/api/sell/sellStocks?id=${stockId}&error=` +
            encodeURIComponent(TradeMessages.INVALID_CREDENTIAL_ALT)
          );
        }
      } else {
        res.redirect(
          `/api/sell/sellStocks?id=${stockId}&error=` +
          encodeURIComponent(TradeMessages.INVALID_CREDENTIAL_ALT)
        );
      }
    }
  });
});




router.get('/autoBuy', (req, res) => {
  var id = req.query.id;
  var error = req.query.error;
  res.render(ViewNames.AUTO_BUY, {
    id,
    error
  });
})

router.post('/autoBuyStock', (req, res) => {
  var symbol2 = req.body.stockid
  let symbol = symbol2.substring(0, symbol2.length - 3);
  var username = req.body.username;
  var password = req.body.password;
  var units = parseInt(req.body.units);
  var selected_price = parseFloat(req.body.targetPrice);

  var sql = `select * from stockuser where username='${username}'`;

  con.query(sql, (error, result) => {
    if (error) {
      return res.redirect(
        `${Routes.SELL_AUTO_BUY}?id=${symbol2}&error=${encodeURIComponent(
          FlashMessages.AUTO_ORDER_FAILED
        )}`
      );
    } else {
      if (result[0]) {
        let gg = crypt.decrypt(result[0].password);
        if (gg.localeCompare(password) == 0) {
          var amount_req = units * selected_price;
          if (result[0].amount < amount_req) {
            res.redirect(
              `${Routes.SELL_AUTO_BUY}?id=${symbol2}&error=${TradeMessages.INSUFFICIENT_BALANCE}`
            );
          } else {
            var sql = `select * from autoBuy where id='${symbol}' and username='${username}' and selected_price=${selected_price}`;

            con.query(sql, (error, result) => {
              if (error) {
                return res.redirect(
                  `${Routes.SELL_AUTO_BUY}?id=${symbol2}&error=${encodeURIComponent(
                    FlashMessages.AUTO_ORDER_FAILED
                  )}`
                );
              } else {
                if (result[0]) {
                  var newUnits = units + result[0].units;
                  var sql = `update autoBuy set units=${newUnits},selected_price=${selected_price} where id='${symbol}'`;
                  con.query(sql, (error, result) => {
                    if (error) {
                      return res.redirect(
                        `${Routes.SELL_AUTO_BUY}?id=${symbol2}&error=${encodeURIComponent(
                          FlashMessages.AUTO_ORDER_FAILED
                        )}`
                      );
                    }
                    res.redirect(
                      `${Routes.SELL_AUTO_BUY}?id=${symbol2}&error=${TradeMessages.SUCCESSFULLY_ADDED}`
                    );
                  })
                } else {
                  var sql = `INSERT INTO autoBuy VALUES ('${symbol}', ${units}, '${username}', ${selected_price})`;
                  con.query(sql, (error, result) => {
                    if (error) {
                      return res.redirect(
                        `${Routes.SELL_AUTO_BUY}?id=${symbol2}&error=${encodeURIComponent(
                          FlashMessages.AUTO_ORDER_FAILED
                        )}`
                      );
                    }
                    res.redirect(
                      `${Routes.SELL_AUTO_BUY}?id=${symbol2}&error=${TradeMessages.SUCCESSFULLY_ADDED}`
                    );
                  })
                }
              }
            })
          }
        } else {
          res.redirect(
            `${Routes.SELL_AUTO_BUY}?id=${symbol2}&error=${TradeMessages.WRONG_PASSWORD}`
          );
        }
      } else {
        res.redirect(
          `${Routes.SELL_AUTO_BUY}?id=${symbol2}&error=${TradeMessages.INVALID_CREDENTIALS}`
        );
      }
    }
  })

})

router.get('/autoSell', (req, res) => {
  var id = req.query.id;

  var error = req.query.error;
  res.render(ViewNames.AUTO_SELL, {
    id,
    error
  });
})

router.post('/autoSellStock', (req, res) => {
  var symbol2 = req.body.stockid
  let symbol = symbol2.substring(0, symbol2.length - 3);
  var username = req.body.username;
  var password = req.body.password;
  var units = parseInt(req.body.units);
  var selected_price = parseFloat(req.body.targetPrice);

  var sql = `select * from stockuser where username='${username}'`;

  con.query(sql, (error, result) => {
    if (error) {
      return res.redirect(
        `${Routes.SELL_AUTO_SELL}?id=${symbol2}&error=${encodeURIComponent(
          FlashMessages.AUTO_ORDER_FAILED
        )}`
      );
    } else {
      if (result[0]) {
        let gg = crypt.decrypt(result[0].password);
        if (gg.localeCompare(password) == 0) {

          if (result[0].units >= units) {
            res.redirect(
              `${Routes.SELL_AUTO_SELL}?id=${symbol2}&error=${TradeMessages.INSUFFICIENT_UNITS}`
            );
          } else {
            var sql = `select * from autoSell where id='${symbol}' and username='${username}' and selected_price=${selected_price}`;

            con.query(sql, (error, result) => {
              if (error) {
                return res.redirect(
                  `${Routes.SELL_AUTO_SELL}?id=${symbol2}&error=${encodeURIComponent(
                    FlashMessages.AUTO_ORDER_FAILED
                  )}`
                );
              } else {
                if (result[0]) {
                  var newUnits = result[0].units + units;
                  var sql = `update autoSell set units=${newUnits},selected_price=${selected_price} where id='${symbol}'`;
                  con.query(sql, (error, result) => {
                    if (error) {
                      return res.redirect(
                        `${Routes.SELL_AUTO_SELL}?id=${symbol2}&error=${encodeURIComponent(
                          FlashMessages.AUTO_ORDER_FAILED
                        )}`
                      );
                    }
                    res.redirect(
                      `${Routes.SELL_AUTO_SELL}?id=${symbol2}&error=${TradeMessages.SUCCESSFULLY_ADDED}`
                    );
                  })
                } else {
                  var sql = `INSERT INTO autoSell VALUES ('${symbol}', ${units}, '${username}', ${selected_price})`;
                  con.query(sql, (error, result) => {
                    if (error) {
                      return res.redirect(
                        `${Routes.SELL_AUTO_SELL}?id=${symbol2}&error=${encodeURIComponent(
                          FlashMessages.AUTO_ORDER_FAILED
                        )}`
                      );
                    }
                    res.redirect(
                      `${Routes.SELL_AUTO_SELL}?id=${symbol2}&error=${TradeMessages.SUCCESSFULLY_ADDED}`
                    );
                  })
                }
              }
            })
          }
        } else {
          res.redirect(
            `${Routes.SELL_AUTO_SELL}?id=${symbol2}&error=${TradeMessages.WRONG_PASSWORD}`
          );
        }
      } else {
        res.redirect(
          `${Routes.SELL_AUTO_SELL}?id=${symbol2}&error=${TradeMessages.INVALID_CREDENTIALS}`
        );
      }
    }
  })

})





module.exports = router;
