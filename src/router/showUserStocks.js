const express = require("express");
var con = require("../database/db");
const router = express.Router();
const middlewares = require("../utils/verifyUser.js");
const yahooFinance = require("yahoo-finance2").default;
var flash = require("connect-flash");
const fetch = require("node-fetch");

const crypt = require("../utils/crypt");
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

const getPrice = async (row) => {
  return new Promise((resolve, reject) => {
    yahooFinance
      .quote(row)
      .then((quote) => {

        resolve(quote.regularMarketPrice);
      })
      .catch((err) => {
        resolve(undefined);
      });
  });
};

const getPriceNew = async (row) => {
  try {
    row += StockIdentifiers.EQN_SUFFIX;
    const response = await fetch(
      rapidPriceUrl(StockIndexes.NIFTY_200, row), {
        headers: rapidHeaders(false),
      }
    );

    const data = await response.json();
    return data[0].lastPrice;
  } catch (err) {
    return undefined;
  }
};
router.get("/showUserStocks", async (req, res) => {
  try {
    const sql = `SELECT * FROM userStocks`;
    con.query(sql, async (error, result) => {
      if (error) {
        return res.redirect(
          `/api/showUserStocks/showUserStocks?error=${encodeURIComponent(
            FlashMessages.DB_ERROR
          )}`
        );
      }

      if (result.length === 0) {
        res.render(ViewNames.SHOW_USER_STOCKS, {
          resultWithProfit: [],
        });
        return;
      }

      const resultWithProfit = await Promise.all(
        result.map(async (row) => {

          const price = await getPriceNew(row.id);
          var currValue = parseFloat(price) * parseInt(row.units);
          currValue = currValue.toFixed(2);
          var profit = (currValue * 100) / row.amt_invested;
          profit = (profit - 100).toFixed(2);

          var flagProfit = false;
          if (profit >= 0) {
            flagProfit = true;
          }

          return {
            ...row,
            currValue: currValue,
            profit: profit,
            flagProfit,
          };
        })
      );

      res.render(ViewNames.SHOW_USER_STOCKS, {
        resultWithProfit,
      });
    });
  } catch (error) {
    res.redirect(
      `/api/showUserStocks/showUserStocks?error=${encodeURIComponent(
        FlashMessages.TRY_AGAIN
      )}`
    );
  }
});

router.get("/stockSelect", async (req, res) => {
  try {
    const response = await fetch(
      rapidPriceUrl(StockIndexes.NIFTY_200), {
        headers: rapidHeaders(true),
      }
    );

    const data = await response.json();
    const sortedData = data.sort((a, b) =>
      a.identifier > b.identifier ? 1 : -1
    );

    const resultWithProfit = await Promise.all(
      sortedData.map(async (row) => {
        var flagProfit = false;
        if (row.change >= 0) {
          flagProfit = true;
        }

        return {
          ...row,
          flagProfit,
        };
      })
    );


    res.render(ViewNames.STOCK_SELECT, {
      resultWithProfit,
    });
  } catch (err) {
    res.redirect(
      `/api/showUserStocks/stockSelect?error=${encodeURIComponent(
        FlashMessages.STOCK_FETCH_FAILED
      )}`
    );
  }
});

router.get("/buy", async (req, res) => {
  try {
    const id = req.query.id;

    const message = req.query.message;
    var sql = `SELECT * FROM stocks WHERE id=?`;
    con.query(sql, [id], (error, result) => {
      if (error) {
        return res.redirect(
          `/api/showUserStocks/stockSelect?error=${encodeURIComponent(
            FlashMessages.DB_ERROR
          )}`
        );
      }

      res.render(ViewNames.BUY, {
        result,
        message,
      });
    });
  } catch (error) {
    if (error) {
    }
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

router.get("/productDescription", async (req, res, next) => {
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

  var autoBuyIdentfier = identifier.substring(1,identifier.length-1);
  var symbol = quote.id + ".NS";
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

  var fun = async function (symbol, options) {
    try {
      var data = await yahooFinance.historical(symbol, options);
      return data;
    } catch (error) {
      return undefined;
    }
  };

  async function getStockData() {
    let stockData = await fun(symbol, options);

    if (!stockData) {
      res
        .status(404)
        .send(
          `<h2 style="display:flex; justify-content:center; align-items:center;">${StatusMessages.STOCK_DATA_UNAVAILABLE}</h2>`
        );
    } else {
      // now take two arrays , one for date and one for price of stock at that date
      var dates = [];
      var prices = [];
      stockData.forEach((obj) => {
        // extract the first 10 characters of the date string
        var date = obj.date.toISOString().slice(0, 10);
        const dateObj = new Date(date);
        const options = {
          day: "2-digit",
          month: "short",
          year: "2-digit",
        };
        const formattedDate = dateObj.toLocaleDateString("en-GB", options);

        var price = parseFloat(obj.close);
        dates.push(formattedDate);
        prices.push(price);
      });

      res.render(ViewNames.PRODUCT_DESCRIPTION, {
        quote,
        message,
        prices: JSON.stringify(prices),
        dates: JSON.stringify(dates),
        autoBuyIdentfier,
      });
    }
  }

  getStockData();

});

router.get("/stockHome", middlewares.verifyUser, async (req, res) => {
  try {
    const response = await fetch(
      rapidPriceUrl(StockIndexes.NIFTY_200), {
        headers: rapidHeaders(true),
      }
    );

    const data = await response.json();
    const sortedData = data.sort((a, b) =>
      a.totalTradedVolume <= b.totalTradedVolume ? 1 : -1
    );

    var name = req.user.Name;
    var email = req.user.email;

    sortedData.length = 4;
    var sql = `select * from reviews`;
    con.query(sql, (error, result) => {
      if (error) {
        return res.redirect(
          `/api/showUserStocks/stockSelect?error=${encodeURIComponent(
            FlashMessages.DB_ERROR
          )}`
        );
      }
      res.render(ViewNames.STOCK_HOME, {
        result,
        name,
        email,
        sortedData,
      });
    });
  } catch (err) {
    res.redirect(
      `/api/showUserStocks/stockSelect?error=${encodeURIComponent(
        FlashMessages.STOCK_FETCH_FAILED
      )}`
    );
  }
});


router.get("/mostBought", async (req, res, next) => {
  try {
    const response = await fetch(
      rapidPriceUrl(StockIndexes.NIFTY_200), {
        headers: rapidHeaders(true),
      }
    );

    const data = await response.json();
    const sortedData = data.sort((a, b) =>
      a.totalTradedVolume <= b.totalTradedVolume ? 1 : -1
    );

    const resultWithProfit = await Promise.all(
      sortedData.map(async (row) => {
        var flagProfit = false;
        if (row.change >= 0) {
          flagProfit = true;
        }

        return {
          ...row,
          flagProfit,
        };
      })
    );

    res.render(ViewNames.MOST_BOUGHT, {
      resultWithProfit,
    });
  } catch (err) {
    res.redirect(
      `/api/showUserStocks/stockSelect?error=${encodeURIComponent(
        FlashMessages.STOCK_FETCH_FAILED
      )}`
    );
  }
});


router.get("/topGainers", async (req, res, next) => {
  try {
    const response = await fetch(
      rapidPriceUrl(StockIndexes.NIFTY_200), {
        headers: rapidHeaders(true),
      }
    );

    const data = await response.json();
    const sortedData = data.sort((a, b) => (a.pChange <= b.pChange ? 1 : -1));

    const resultWithProfit = await Promise.all(
      sortedData.map(async (row) => {
        var flagProfit = false;
        if (row.change >= 0) {
          flagProfit = true;
        }

        return {
          ...row,
          flagProfit,
        };
      })
    );

    res.render(ViewNames.TOP_GAINERS, {
      resultWithProfit,
    });
  } catch (err) {
    res.redirect(
      `/api/showUserStocks/stockSelect?error=${encodeURIComponent(
        FlashMessages.STOCK_FETCH_FAILED
      )}`
    );
  }
});


router.get("/topLosers", async (req, res, next) => {
  try {
    const response = await fetch(
      rapidPriceUrl(StockIndexes.NIFTY_200), {
        headers: rapidHeaders(true),
      }
    );

    const data = await response.json();
    const sortedData = data.sort((a, b) => (a.pChange >= b.pChange ? 1 : -1));

    const resultWithProfit = await Promise.all(
      sortedData.map(async (row) => {
        var flagProfit = false;
        if (row.change >= 0) {
          flagProfit = true;
        }

        return {
          ...row,
          flagProfit,
        };
      })
    );

    res.render(ViewNames.TOP_LOSERS, {
      resultWithProfit,
    });
  } catch (err) {
    res.redirect(
      `/api/showUserStocks/stockSelect?error=${encodeURIComponent(
        FlashMessages.STOCK_FETCH_FAILED
      )}`
    );
  }
});


router.get("/userReview", middlewares.verifyUser, async (req, res) => {
  var username = req.user.username;

  res.render(ViewNames.USER_REVIEW, {
    username
  });
});
router.post("/review", middlewares.verifyUser, async (req, res, next) => {
  var username = req.query.username;
  var rating = req.body.rating;
  var comment = req.body.comment;
  var sql = `insert into reviews (username, rating, comment) values ('${username}', ${rating}, '${comment}')`;
  con.query(sql, (error, result) => {
    if (error) {
      return res.redirect(
        `/api/showUserStocks/userReview?error=${encodeURIComponent(
          FlashMessages.DB_ERROR
        )}`
      );
    }

    res.render(ViewNames.USER_REVIEW, {
      username,
    });
  });
});

router.get("/allUserReview", middlewares.verifyUser, async (req, res) => {
  var name = req.user.Name;
  var email = req.user.email;

  var sql = `select * from reviews`;
  con.query(sql, (error, result) => {
    if (error) {
      return res.redirect(
        `/api/showUserStocks/stockHome?error=${encodeURIComponent(
          FlashMessages.DB_ERROR
        )}`
      );
    }
    res.render(ViewNames.ALL_USER_REVIEW, {
      result,
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

router.get("/wishlist", middlewares.verifyUser, async (req, res) => {
  var sql = `select * from wishlist `;

  con.query(sql, async (error, result) => {
    if (error) {
      return res.redirect(
        `/api/showUserStocks/wishlist?error=${encodeURIComponent(
          FlashMessages.DB_ERROR
        )}`
      );
    }

    const resultWithProfit = await Promise.all(
      result.map(async (row) => {

        const price = await getPriceNew(row.id);

        var currValue = parseFloat(price) * parseInt(row.units);
        currValue = currValue.toFixed(2);
        var profit = (currValue * 100) / row.amt_invested;
        profit = (profit - 100).toFixed(2);

        var flagProfit = false;
        if (profit >= 0) {
          flagProfit = true;
        }

        return {
          ...row,
          currValue: currValue,
          profit: profit,
          flagProfit,
        };
      })
    );

    res.render(ViewNames.WISHLIST, {
      resultWithProfit
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
