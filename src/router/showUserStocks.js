const express = require("express");
var con = require("../database/db");
const router = express.Router();
const middlewares = require("../middleware/verifyUser");
const yahooFinance = require("yahoo-finance2").default;
const fetch = require("node-fetch");
const crypt = require("../utils/crypt");
const {
  getRapidPrice,
  fetchNiftyIndex,
} = require("../services/stockPriceService");
const {
  ViewNames,
  FlashMessages,
  TradeMessages,
  StatusMessages,
  StockIndexes,
  StockIdentifiers,
  rapidPriceUrl,
  rapidHeaders,
} = require("../constants/enums");

router.get("/showUserStocks", middlewares.requireUser, async (req, res) => {
  try {
    const username = req.user.username;
    const sql = `SELECT * FROM userStocks WHERE username = ?`;
    con.query(sql, [username], async (error, result) => {
      if (error) {
        return res.render(ViewNames.SHOW_USER_STOCKS, {
          resultWithProfit: [],
          error: FlashMessages.DB_ERROR,
        });
      }

      const rows = result || [];
      if (rows.length === 0) {
        return res.render(ViewNames.SHOW_USER_STOCKS, {
          resultWithProfit: [],
          message: req.query.message,
          error: req.query.error,
        });
      }

      const resultWithProfit = await Promise.all(
        rows.map(async (row) => {
          const price = await getRapidPrice(row.id);
          const unitCount = parseInt(row.units, 10) || 0;
          const invested = parseFloat(row.amt_invested) || 0;
          const currValueNum = (parseFloat(price) || 0) * unitCount;
          const currValue = currValueNum.toFixed(2);
          let profit = "0.00";
          if (invested > 0) {
            profit = (((currValueNum * 100) / invested) - 100).toFixed(2);
          }
          const flagProfit = parseFloat(profit) >= 0;

          return {
            ...row,
            currValue,
            profit,
            flagProfit,
          };
        })
      );

      res.render(ViewNames.SHOW_USER_STOCKS, {
        resultWithProfit,
        message: req.query.message,
        error: req.query.error,
      });
    });
  } catch (error) {
    res.render(ViewNames.SHOW_USER_STOCKS, {
      resultWithProfit: [],
      error: FlashMessages.TRY_AGAIN,
    });
  }
});

router.get("/stockSelect", async (req, res) => {
  const data = await fetchNiftyIndex(true);
  const sortedData = [...data].sort((a, b) =>
    a.identifier > b.identifier ? 1 : -1
  );
  const resultWithProfit = sortedData.map((row) => ({
    ...row,
    flagProfit: row.change >= 0,
  }));
  const usingDemo = data[0] && data[0]._source === "demo";
  const error = req.query.error || null;
  const message =
    req.query.message ||
    (usingDemo
      ? FlashMessages.STOCK_DEMO_MODE
      : resultWithProfit.length === 0
        ? FlashMessages.STOCK_FETCH_FAILED
        : null);

  res.render(ViewNames.STOCK_SELECT, {
    resultWithProfit,
    error,
    message,
    type: usingDemo ? "warn" : error ? "error" : "info",
  });
});

router.get("/buy", middlewares.requireUser, async (req, res) => {
  try {
    const id = req.query.id;
    if (!id) {
      return res.redirect(
        `/api/showUserStocks/stockSelect?error=${encodeURIComponent(
          FlashMessages.STOCK_FETCH_FAILED
        )}`
      );
    }

    const message = req.query.message;
    const errorMessage = req.query.error;
    var sql = `SELECT * FROM stocks WHERE id=?`;
    con.query(sql, [id], (error, result) => {
      if (error) {
        return res.redirect(
          `/api/showUserStocks/stockSelect?error=${encodeURIComponent(
            FlashMessages.DB_ERROR
          )}`
        );
      }
      if (!result || !result[0]) {
        return res.redirect(
          `/api/showUserStocks/stockSelect?error=${encodeURIComponent(
            StatusMessages.STOCK_DATA_UNAVAILABLE
          )}`
        );
      }

      res.render(ViewNames.BUY, {
        result,
        stockName: result[0].name || result[0].Name || id,
        message,
        errorMessage,
        type: errorMessage ? "error" : message ? "success" : "info",
      });
    });
  } catch (error) {
    res.redirect(
      `/api/showUserStocks/stockSelect?error=${encodeURIComponent(
        FlashMessages.TRY_AGAIN
      )}`
    );
  }
});

router.post("/post", middlewares.verifyUser, async (req, res) => {
  try {
    var id = req.body.id; //stock id
    var userId = req.body.userId;
    var units = parseInt(req.body.units);
    var password = req.body.password;
    var open = req.body.open;

    var name = req.body.name;

    var identifier = name;

    const dayHigh = parseFloat(req.body.dayHigh);
    const dayLow = req.body.dayLow;
    const lastPrice = req.body.lastPrice;
    const previousClose = req.body.previousClose;
    const change = req.body.change;
    const pChange = req.body.pChange;
    const totalTradedVolume = req.body.totalTradedVolume;
    const totalTradedValue = req.body.totalTradedValue;
    const lastUpdateTime = req.body.lastUpdateTime;
    const yearHigh = req.body.yearHigh;
    const yearLow = req.body.yearLow;
    const perChange365d = req.body.perChange365d;
    const perChange30d = req.body.perChange30d;



    var sql = `select * from stockuser where username='${userId}'`;
    con.query(sql, (error, result) => {
      if (error) {
        return res.redirect(
          `/api/showUserStocks/productDescription?id=${id}&error=${encodeURIComponent(
            TradeMessages.TRANSACTION_FAIL
          )}`
        );
      }
      {
        let gg = crypt.decrypt(result[0].password);
        if (gg.localeCompare(password) == 0) {
          if (result[0]) {
            var cost = units * open;


            if (cost > result[0].amount) {
              res.redirect(
                `/api/showUserStocks/productDescription?id=${id}&identifier=${identifier}&open=${open}&dayHigh=${dayHigh}&dayLow=${dayLow}&lastPrice=${lastPrice}&previousClose=${previousClose}&change=${change}&pChange=${pChange}&totalTradedVolume=${totalTradedVolume}&totalTradedValue=${totalTradedValue}&lastUpdateTime=${lastUpdateTime}&yearHigh=${yearHigh}&yearLow=${yearLow}&perChange365d=${perChange365d}&perChange30d=${perChange30d}&error=` +
                encodeURIComponent(TradeMessages.INSUFFICIENT_FUND)
              );
            } else {
              var newAmount = result[0].amount - cost;
              var sql2 = `update stockuser set amount=${newAmount} where username='${userId}'`;
              con.query(sql2, (error, result) => {
                if (error) {
                  return res.redirect(
                    `/api/showUserStocks/productDescription?id=${id}&error=${encodeURIComponent(
                      TradeMessages.TRANSACTION_FAIL
                    )}`
                  );
                }
              });

              var sql = `SELECT * FROM userStocks WHERE id=? and username='${req.user.username}'`;
              con.query(sql, [id], (error, result) => {
                if (error) {
                  return res.redirect(
                    `/api/showUserStocks/productDescription?id=${id}&error=${encodeURIComponent(
                      TradeMessages.TRANSACTION_FAIL
                    )}`
                  );
                }
                if (result[0]) {
                  var newUnit = result[0].units + units;
                  var newamt = result[0].amt_invested + cost;
                  var sql = `UPDATE userStocks set units=${newUnit}, amt_invested=${newamt} WHERE id="${id}" and username='${req.user.username}'`;
                  con.query(sql, (error, result) => {
                    if (error) {
                      return res.redirect(
                        `/api/showUserStocks/productDescription?id=${id}&error=${encodeURIComponent(
                          TradeMessages.TRANSACTION_FAIL
                        )}`
                      );
                    }
                    res.redirect(
                      `/api/showUserStocks/productDescription?id=${id}&identifier=${identifier}&open=${open}&dayHigh=${dayHigh}&dayLow=${dayLow}&lastPrice=${lastPrice}&previousClose=${previousClose}&change=${change}&pChange=${pChange}&totalTradedVolume=${totalTradedVolume}&totalTradedValue=${totalTradedValue}&lastUpdateTime=${lastUpdateTime}&yearHigh=${yearHigh}&yearLow=${yearLow}&perChange365d=${perChange365d}&perChange30d=${perChange30d}&error=` +
                      encodeURIComponent(TradeMessages.TRANSACTION_SUCCESS)
                    );
                  });
                } else {

                  var sql = `INSERT INTO userStocks VALUES(?,?,?,?,?)`;

                  var values = [id, name, units, cost, req.user.username];

                  con.query(sql, values, (error, result) => {
                    if (error) {
                      res.redirect(
                        `/api/showUserStocks/productDescription?id=${id}&identifier=${identifier}&open=${open}&dayHigh=${dayHigh}&dayLow=${dayLow}&lastPrice=${lastPrice}&previousClose=${previousClose}&change=${change}&pChange=${pChange}&totalTradedVolume=${totalTradedVolume}&totalTradedValue=${totalTradedValue}&lastUpdateTime=${lastUpdateTime}&yearHigh=${yearHigh}&yearLow=${yearLow}&perChange365d=${perChange365d}&perChange30d=${perChange30d}&error=` +
                        encodeURIComponent(TradeMessages.TRANSACTION_FAIL)
                      );
                    }
                    res.redirect(
                      `/api/showUserStocks/productDescription?id=${id}&identifier=${identifier}&open=${open}&dayHigh=${dayHigh}&dayLow=${dayLow}&lastPrice=${lastPrice}&previousClose=${previousClose}&change=${change}&pChange=${pChange}&totalTradedVolume=${totalTradedVolume}&totalTradedValue=${totalTradedValue}&lastUpdateTime=${lastUpdateTime}&yearHigh=${yearHigh}&yearLow=${yearLow}&perChange365d=${perChange365d}&perChange30d=${perChange30d}&error=` +
                      encodeURIComponent(TradeMessages.TRANSACTION_SUCCESS)
                    );
                  });
                }
              });
            }
          } else {
            res.redirect(
              `/api/showUserStocks/productDescription?id=${id}&identifier=${identifier}&open=${open}&dayHigh=${dayHigh}&dayLow=${dayLow}&lastPrice=${lastPrice}&previousClose=${previousClose}&change=${change}&pChange=${pChange}&totalTradedVolume=${totalTradedVolume}&totalTradedValue=${totalTradedValue}&lastUpdateTime=${lastUpdateTime}&yearHigh=${yearHigh}&yearLow=${yearLow}&perChange365d=${perChange365d}&perChange30d=${perChange30d}&error=` +
              encodeURIComponent(TradeMessages.USER_NOT_EXIST)
            );
          }
        } else {
          res.redirect(
            `/api/showUserStocks/productDescription?id=${id}&identifier=${identifier}&open=${open}&dayHigh=${dayHigh}&dayLow=${dayLow}&lastPrice=${lastPrice}&previousClose=${previousClose}&change=${change}&pChange=${pChange}&totalTradedVolume=${totalTradedVolume}&totalTradedValue=${totalTradedValue}&lastUpdateTime=${lastUpdateTime}&yearHigh=${yearHigh}&yearLow=${yearLow}&perChange365d=${perChange365d}&perChange30d=${perChange30d}&error=` +
            encodeURIComponent(TradeMessages.INVALID_PASSWORD_ALT)
          );
        }
      }
    });
  } catch (error) {
    res.redirect(
      `/api/showUserStocks/stockSelect?error=${encodeURIComponent(
        FlashMessages.TRY_AGAIN
      )}`
    );
  }
});

router.get("/productDescription", middlewares.verifyUser, async (req, res) => {
  var message = req.query.error;
  const {
    id,
    identifier,
    open,
    dayHigh,
    dayLow,
    lastPrice,
    previousClose,
    change,
    pChange,
    totalTradedVolume,
    totalTradedValue,
    lastUpdateTime,
    yearHigh,
    yearLow,
    perChange365d,
    perChange30d,
  } = req.query;

  if (!id || !identifier) {
    return res.redirect(
      `/api/showUserStocks/stockSelect?error=${encodeURIComponent(
        StatusMessages.STOCK_DATA_UNAVAILABLE
      )}`
    );
  }

  const quote = {
    id,
    identifier,
    open,
    dayHigh,
    dayLow,
    lastPrice,
    previousClose,
    change,
    pChange,
    totalTradedVolume,
    totalTradedValue,
    lastUpdateTime,
    yearHigh,
    yearLow,
    perChange365d,
    perChange30d,
  };

  const cleaned =
    typeof identifier === "string"
      ? identifier.replace(/^["']|["']$/g, "")
      : String(id);
  var autoBuyIdentfier = cleaned;
  var symbol = String(quote.id) + ".NS";
  const today = new Date();
  const end = today.toISOString().slice(0, 10);
  const start = new Date(
      today.getFullYear(),
      today.getMonth() - 12,
      today.getDate()
    )
    .toISOString()
    .slice(0, 10);
  const options = {
    period1: start,
    period2: end,
    interval: "1d",
  };

  async function getStockData() {
    let stockData;
    try {
      stockData = await yahooFinance.historical(symbol, options);
    } catch (error) {
      stockData = undefined;
    }

    const dates = [];
    const prices = [];
    if (Array.isArray(stockData) && stockData.length > 0) {
      stockData.forEach((obj) => {
        var date = obj.date.toISOString().slice(0, 10);
        const dateObj = new Date(date);
        const formattedDate = dateObj.toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "2-digit",
        });
        dates.push(formattedDate);
        prices.push(parseFloat(obj.close));
      });
    }

    res.render(ViewNames.PRODUCT_DESCRIPTION, {
      quote,
      message: message || (prices.length ? null : StatusMessages.STOCK_DATA_UNAVAILABLE),
      type: message ? "error" : prices.length ? "info" : "warn",
      prices: JSON.stringify(prices),
      dates: JSON.stringify(dates),
      autoBuyIdentfier,
      hasChart: prices.length > 0,
    });
  }

  getStockData();
});

router.get("/stockHome", middlewares.requireUser, async (req, res) => {
  const data = await fetchNiftyIndex(true);
  const trending = [...data]
    .sort((a, b) => (a.totalTradedVolume <= b.totalTradedVolume ? 1 : -1))
    .slice(0, 4);
  const topGainersPreview = [...data]
    .sort((a, b) => (a.pChange <= b.pChange ? 1 : -1))
    .slice(0, 4);
  const topLosersPreview = [...data]
    .sort((a, b) => (a.pChange >= b.pChange ? 1 : -1))
    .slice(0, 4);
  // Back-compat for any leftover template refs
  const sortedData = trending;

  const name = req.user && (req.user.name || req.user.Name);
  const email = req.user && req.user.email;
  const usingDemo = data[0] && data[0]._source === "demo";
  const marketError = usingDemo
    ? FlashMessages.STOCK_DEMO_MODE
    : data.length === 0
      ? FlashMessages.STOCK_FETCH_FAILED
      : null;
  const alertType = usingDemo ? "warn" : marketError ? "error" : "info";

  con.query(`select * from reviews`, (error, result) => {
    const payload = {
      result: error ? [] : result || [],
      name,
      email,
      sortedData,
      trending,
      topGainersPreview,
      topLosersPreview,
      message: error ? FlashMessages.DB_ERROR : marketError,
      type: error ? "error" : alertType,
      hasMarketData: data.length > 0,
    };
    res.render(ViewNames.STOCK_HOME, payload);
  });
});


function marketListPayload(data, sorter) {
  const resultWithProfit = [...data]
    .sort(sorter)
    .map((row) => ({ ...row, flagProfit: row.change >= 0 }));
  const usingDemo = data[0] && data[0]._source === "demo";
  return {
    resultWithProfit,
    message: usingDemo
      ? FlashMessages.STOCK_DEMO_MODE
      : resultWithProfit.length === 0
        ? FlashMessages.STOCK_FETCH_FAILED
        : null,
    type: usingDemo ? "warn" : resultWithProfit.length ? "info" : "error",
  };
}

router.get("/mostBought", async (req, res) => {
  const data = await fetchNiftyIndex(true);
  res.render(
    ViewNames.MOST_BOUGHT,
    marketListPayload(data, (a, b) =>
      a.totalTradedVolume <= b.totalTradedVolume ? 1 : -1
    )
  );
});

router.get("/topGainers", async (req, res) => {
  const data = await fetchNiftyIndex(true);
  res.render(
    ViewNames.TOP_GAINERS,
    marketListPayload(data, (a, b) => (a.pChange <= b.pChange ? 1 : -1))
  );
});

router.get("/topLosers", async (req, res) => {
  const data = await fetchNiftyIndex(true);
  res.render(
    ViewNames.TOP_LOSERS,
    marketListPayload(data, (a, b) => (a.pChange >= b.pChange ? 1 : -1))
  );
});


router.get("/userReview", middlewares.requireUser, async (req, res) => {
  res.render(ViewNames.USER_REVIEW, {
    username: req.user.username,
    error: req.query.error,
    message: req.query.message,
    type: req.query.error ? "error" : "success",
  });
});
router.post("/review", middlewares.requireUser, async (req, res) => {
  var username = req.user.username;
  var rating = parseInt(req.body.rating, 10);
  var comment = (req.body.comment || "").trim();
  if (!rating || rating < 1 || rating > 5 || !comment) {
    return res.redirect(
      `/api/showUserStocks/userReview?error=${encodeURIComponent(
        FlashMessages.TRY_AGAIN
      )}`
    );
  }
  var sql = `insert into reviews (username, rating, comment) values (?, ?, ?)`;
  con.query(sql, [username, rating, comment], (error) => {
    if (error) {
      return res.redirect(
        `/api/showUserStocks/userReview?error=${encodeURIComponent(
          FlashMessages.DB_ERROR
        )}`
      );
    }

    res.redirect(
      `/api/showUserStocks/userReview?message=${encodeURIComponent(
        "Thanks for sharing your review."
      )}`
    );
  });
});

router.get("/allUserReview", middlewares.requireUser, async (req, res) => {
  var name = req.user.name || req.user.Name;
  var email = req.user.email;

  var sql = `select * from reviews`;
  con.query(sql, (error, result) => {
    if (error) {
      return res.render(ViewNames.ALL_USER_REVIEW, {
        result: [],
        name,
        email,
        error: FlashMessages.DB_ERROR,
      });
    }
    res.render(ViewNames.ALL_USER_REVIEW, {
      result: result || [],
      name,
      email,
    });
  });
});

const getPriceNew1 = async (row) => {
  try {
    row += StockIdentifiers.EQN_SUFFIX;
    const response = await fetch(
      rapidPriceUrl(StockIndexes.NIFTY_200, row), {
        headers: rapidHeaders(false),
      }
    );

    const data = await response.json();
    return data[0];
  } catch (err) {
    return undefined;
  }
};

router.get("/wishlist", middlewares.requireUser, async (req, res) => {
  var sql = `select * from wishlist where username = ?`;

  con.query(sql, [req.user.username], async (error, result) => {
    if (error) {
      return res.render(ViewNames.WISHLIST, {
        resultWithProfit: [],
        error: FlashMessages.DB_ERROR,
      });
    }

    const rows = result || [];
    const resultWithProfit = await Promise.all(
      rows.map(async (row) => {
        const price = await getRapidPrice(row.id);
        const unitCount = parseInt(row.units, 10) || 0;
        const currValueNum = (parseFloat(price) || 0) * unitCount;
        const currValue = currValueNum.toFixed(2);
        const invested = parseFloat(row.amt_invested);
        let profit = null;
        let flagProfit = true;
        if (invested > 0) {
          profit = (((currValueNum * 100) / invested) - 100).toFixed(2);
          flagProfit = parseFloat(profit) >= 0;
        }

        return {
          ...row,
          currValue,
          profit,
          flagProfit,
          lastPrice: price,
        };
      })
    );

    res.render(ViewNames.WISHLIST, {
      resultWithProfit,
      error: req.query.error,
      message: req.query.message,
    });
  });
});


router.post("/addToWishlist", middlewares.verifyUser, async (req, res) => {
  var id = req.body.id;
  var userId = req.body.userId;
  var units = parseInt(req.body.units);
  var password = req.body.password;

  var open = req.body.open;

  var name = req.body.name;

  var identifier = name;

  const dayHigh = parseFloat(req.body.dayHigh);
  const dayLow = req.body.dayLow;
  const lastPrice = req.body.lastPrice;
  const previousClose = req.body.previousClose;
  const change = req.body.change;
  const pChange = req.body.pChange;

  const totalTradedVolume = req.body.totalTradedVolume;
  const totalTradedValue = req.body.totalTradedValue;
  const lastUpdateTime = req.body.lastUpdateTime;
  const yearHigh = req.body.yearHigh;
  const yearLow = req.body.yearLow;
  const perChange365d = req.body.perChange365d;
  const perChange30d = req.body.perChange30d;
  var sql = `insert into wishlist (id, name , units, username) values ('${id}',${name}, ${units}, '${userId}')`;
  con.query(sql, (error, result) => {
    if (error) {
      return res.redirect(
        `/api/showUserStocks/productDescription?id=${id}&identifier=${identifier}&error=${encodeURIComponent(
          TradeMessages.TRANSACTION_FAIL
        )}`
      );
    }
    res.redirect(
      `/api/showUserStocks/productDescription?id=${id}&identifier=${identifier}&open=${open}&dayHigh=${dayHigh}&dayLow=${dayLow}&lastPrice=${lastPrice}&previousClose=${previousClose}&change=${change}&pChange=${pChange}&totalTradedVolume=${totalTradedVolume}&totalTradedValue=${totalTradedValue}&lastUpdateTime=${lastUpdateTime}&yearHigh=${yearHigh}&yearLow=${yearLow}&perChange365d=${perChange365d}&perChange30d=${perChange30d}&error=` +
      encodeURIComponent(TradeMessages.WISHLIST_ADDED)
    );
  });
});

router.get("/buyWishlist", middlewares.verifyUser, async (req, res) => {

  try {
    var id = req.query.id;
    var name = req.query.name;
    var units = req.query.units;
    var username = req.user.username;
    var data = await getPriceNew1(id);

    var open = data.open;

    var sql = `select * from stockuser where username='${username}'`;
    con.query(sql, (error, result) => {
      if (error) {
        return res.redirect(
          `/api/showUserStocks/wishlist?error=${encodeURIComponent(
            TradeMessages.TRANSACTION_FAIL
          )}`
        );
      } else {
        if (result[0]) {
          var cost = units * open;

          if (cost > result[0].amount) {
            res.redirect(
              `/api/showUserStocks/wishlist&error=` +
              encodeURIComponent(TradeMessages.INSUFFICIENT_FUND)
            );
          } else {
            var newAmount = result[0].amount - cost;
            var sql2 = `update stockuser set amount=${newAmount} where username='${username}'`;
            con.query(sql2, (error, result) => {
              if (error) {
                return res.redirect(
                  `/api/showUserStocks/wishlist?error=${encodeURIComponent(
                    TradeMessages.TRANSACTION_FAIL
                  )}`
                );
              }
            });

            var sql = `SELECT * FROM userStocks WHERE id=? and username='${req.user.username}'`;
            con.query(sql, [id], (error, result) => {
              if (error) {
                return res.redirect(
                  `/api/showUserStocks/wishlist?error=${encodeURIComponent(
                    TradeMessages.TRANSACTION_FAIL
                  )}`
                );
              }
              if (result[0]) {
                var newUnit = result[0].units + units;
                var newamt = result[0].amt_invested + cost;
                var sql = `UPDATE userStocks set units=${newUnit}, amt_invested=${newamt} WHERE id="${id}" and username='${req.user.username}'`;
                con.query(sql, (error, result) => {
                  if (error) {
                    return res.redirect(
                      `/api/showUserStocks/wishlist?error=${encodeURIComponent(
                        TradeMessages.TRANSACTION_FAIL
                      )}`
                    );
                  }
                  var sql10 = `DELETE FROM wishlist WHERE id='${id}'`;
                  con.query(sql10, (error, result) => {
                    if (error) {
                      return res.redirect(
                        `/api/showUserStocks/wishlist?error=${encodeURIComponent(
                          TradeMessages.TRANSACTION_FAIL
                        )}`
                      );
                    }

                    res.redirect(
                      `/api/showUserStocks/wishlist?error=` +
                      encodeURIComponent(TradeMessages.TRANSACTION_SUCCESS)
                    );
                  });
                });
              } else {
                var sql = `INSERT INTO userStocks VALUES(?,?,?,?,?)`;

                var values = [id, name, units, cost, req.user.username];

                con.query(sql, values, (error, result) => {
                  if (error) {
                    res.redirect(
                      `/api/showUserStocks/wishlist&error=` +
                      encodeURIComponent(TradeMessages.TRANSACTION_FAIL)
                    );
                  }

                  var sql10 = `DELETE FROM wishlist WHERE id='${id}'`;
                  con.query(sql10, (error, result) => {
                    if (error) {
                      return res.redirect(
                        `/api/showUserStocks/wishlist?error=${encodeURIComponent(
                          TradeMessages.TRANSACTION_FAIL
                        )}`
                      );
                    }

                    res.redirect(
                      `/api/showUserStocks/wishlist?error=` +
                      encodeURIComponent(TradeMessages.TRANSACTION_SUCCESS)
                    );
                  });


                });
              }
            });
          }
        } else {
          res.redirect(
            `/api/showUserStocks/wishlist&error=` +
            encodeURIComponent(TradeMessages.USER_NOT_EXIST)
          );
        }
      }
    });
  } catch (error) {
    res.redirect(
      `/api/showUserStocks/wishlist?error=${encodeURIComponent(
        FlashMessages.TRY_AGAIN
      )}`
    );
  }

});

module.exports = router;
