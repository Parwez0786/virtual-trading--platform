const express = require("express");

const path = require("path");

require("dotenv").config({

  path: path.join(__dirname, "../.env"),

});



const {

  AuthSecrets,

  ServerConfig,

  Routes,

  ViewNames,

  StatusMessages,

  StockIndexes,

  StockIdentifiers,

  JobIntervals,

  OAuthScopes,

  SessionConfig,

  FlashKeys,

  alphaVantageUrl,

  rapidPriceUrl,

  rapidHeaders,

} = require("./constants/enums");
const Logger = require("./utils/logger");



const app = express();

const hbs = require("hbs");

const jwt = require("jsonwebtoken");



const JWT_SECRET = AuthSecrets.JWT;


const transport = require("../src/mailer/mailsend");

var db = require("../src/database/db");

require("./auth");

const cookieParser = require("cookie-parser");

app.use(cookieParser());

var userkiId;

var genereted_account_no;

var password_from_database;

var email_from_database;

var enrollment;



var session = require("express-session");

var flush = require("connect-flash");

const bodyparser = require("body-parser");

app.use(bodyparser.urlencoded({

  extended: true

}));

const {

  constants

} = require("buffer");

const passport = require("passport");

const {

  profile

} = require("console");




const staticpath = path.join(__dirname, "../public");

const partialpath = path.join(__dirname, "../templates/partials");

const templatepath = path.join(__dirname, "../templates/views");

app.set("view engine", "hbs");

app.set("views", templatepath);

app.use(express.json());


app.use(express.static(staticpath));

hbs.registerPartials(partialpath);

var global_enroll;



app.use(

  session({

    secret: AuthSecrets.SESSION,

    cookie: {

      maxAge: SessionConfig.MAX_AGE_MS,

    },

    resave: SessionConfig.RESAVE,

    saveUninitialized: SessionConfig.SAVE_UNINITIALIZED,

  })

);

app.use(flush());

const port = ServerConfig.PORT;



app.use(session({

  secret: AuthSecrets.PASSPORT_SESSION

}));

app.use(passport.initialize());

app.use(passport.session());





function isloggedIn(req, res, next) {

  req.user ? next() : res.sendStatus(401);

}




app.get(

  Routes.AUTH_GOOGLE,

  passport.authenticate("google", {

    scope: [OAuthScopes.EMAIL, OAuthScopes.PROFILE]

  })

);

app.get(

  Routes.AUTH_GOOGLE_CALLBACK,

  passport.authenticate("google", {

    successRedirect: "/student_profile",

    failureRedirect: "/auth/failure",

  })

);


app.get(

  Routes.AUTH_GITHUB,

  passport.authenticate("github", {

    scope: [OAuthScopes.EMAIL, OAuthScopes.PROFILE]

  })

);

app.get(

  Routes.AUTH_GITHUB_CALLBACK,

  passport.authenticate("github", {

    successRedirect: "/homepage",

    failureRedirect: "/auth/failure",

  })

);






app.get(

  Routes.AUTH_FACEBOOK,

  passport.authenticate("facebook", {

    scope: [OAuthScopes.EMAIL, OAuthScopes.PROFILE]

  })

);

app.get(

  Routes.AUTH_FACEBOOK_CALLBACK,

  passport.authenticate("facebook", {

    successRedirect: "/homepage",

    failureRedirect: "/auth/failure",

  })

);



app.get("/auth/failure", (req, res) => {

  res.send(StatusMessages.SOMETHING_WRONG);

});

app.get("/protected", isloggedIn, (req, res) => {

  res.send(`hello ${req.user.email}`);

});

app.get("/logout", (req, res) => {

  req.logOut();

  req.session.destroy();

  res.render(ViewNames.HOMEPAGE);

});















app.get("/stock_display", (req, res) => {

  res.render(ViewNames.STOCK_DISPLAY);

});

app.get("/homepage", isloggedIn, (req, res) => {

  var profile_pic;

  if (req.user.picture == null) {

    profile_pic = req.user.photos[0].value;

  } else {

    profile_pic = req.user.picture;

  }

  res.render(ViewNames.HOMEPAGE, {

    email: req.user.email,

    picture: profile_pic

  });

});

app.get("/home2", (req, res) => {

  res.render(ViewNames.HOME2, {

    message: req.flash(FlashKeys.MESSAGE)

  });

});

app.get("/congrats_message", (req, res) => {

  res.render(ViewNames.CONGRATS_MESSAGE, {

    genereted_account_no: genereted_account_no,

  });

});












app.use("/api/auth", require("./router/auth"));

app.use("/api/registerauth", require("./router/registerauth"));

app.use("/api/profileauth", require("./router/profileauth"));

app.use("/api/showUserStocks", require("./router/showUserStocks"));

app.use("/api/loginauth", require("./router/loginauth"));

app.use("/api/sell", require("./router/sell"));

var request = require("request");

app.get("/get_data", async (req, res) => {

  var url = alphaVantageUrl();



  await request.get({

      url: url,

      json: true,

      headers: {

        "User-Agent": "request"

      },

    },

    (err, ress, data) => {

      if (err) {

        return res.status(502).json({ error: StatusMessages.SOMETHING_WRONG });

      } else if (ress.statusCode !== 200) {

        return res.status(502).json({ error: StatusMessages.SOMETHING_WRONG });

      } else {



        const arrayOfObj = Object.entries(data).map((e) => ({

          [e[0]]: e[1],

        }));




        let data2 = arrayOfObj[0]["Meta Data"];


        const newData = {};

        for (const key in data2) {

          let newKey = key;

          newKey = newKey.split(" ")[1];


          newData[newKey] = data2[key];

        }

        res.status(200).json(newData);





      }



    }

  );

});



app.get("/landing", (req, res) => {

  res.render(ViewNames.LANDING);

});









var autoBuy = async function () {


  //traverse through databases and buy if condition is true

  var sql = 'select * from autoBuy';

  db.query(sql, async (error, result_data) => {

    if (error) {

    } else {


      //take out the current price of stock from API

      for (const element of result_data) {

        var ident = element.id + StockIdentifiers.EQN_SUFFIX;




        const getPriceNew = async (ident) => {

          try {

            const response = await fetch(

              rapidPriceUrl(StockIndexes.NIFTY_200, ident), {

                headers: rapidHeaders(),

              }

            );



            const data = await response.json();


            return data[0].lastPrice;



          } catch (err) {

            

          }

        };



        async function getPriceAndDoOperations() {

          try {

            const price = await getPriceNew(ident);




            //if price is lower buy it

            if (price < element.selected_price) {





              var units = element.units;




              //check for sufficient balance


              var sql = `select * from stockuser where username='${element.username}'`;

              db.query(sql, (error, result) => {

                if (error) {

                } else {



                  var newPr = price * units;

                  var old_bal = result[0].amount;





                  //if balance is sufficient

                  if (result[0].amount >= newPr) {

                    //buy it

                    var p = `'` + element.id + `'`;


                    var sql = `select * from userStocks where username='${element.username}' and id='${element.id}'`;

                    db.query(sql, (error, result) => {

                      if (error) {

                      } else {

                        if (result[0]) {

                          //if stock is already present in user invested stock then update

                          var newUnits = units + result[0].units;

                          var newAmtInvested = (units * price) + result[0].amt_invested;



                          var sql = `update userStocks set units=${newUnits}, amt_invested=${newAmtInvested} where id='${element.id}' and username='${element.username}'`

                          db.query(sql, (error, result) => {

                            if (error) {

                            } else {

                              //updated in userstocks table now delete it from auto buy

                              var sql = `delete from autoBuy where id='${element.id}' and username='${element.username}' and selected_price='${element.selected_price}'`;

                              db.query(sql, (error, result) => {

                                if (error) {

                                } else {


                                  //update the amount in stockUser

                                  var newBal = old_bal - newPr;

                                  var sql = `update stockuser set amount=${newBal} where username='${element.username}'`;

                                  db.query(sql, (error, result) => {




                                    //get todays date and time

                                    const currentDate = new Date();



                                    const year = currentDate.getFullYear();

                                    const month = currentDate.getMonth() + 1;

                                    const day = currentDate.getDate();



                                    const hours = currentDate.getHours();

                                    const minutes = currentDate.getMinutes();

                                    const seconds = currentDate.getSeconds();



                                    const formattedDate = `${day}-${month}-${year}`;

                                    const formattedTime = `${hours}:${minutes}:${seconds}`;


                                    //put the value in transaction history

                                    var sql = `insert into transactionHistory values('${element.id}',${element.units},${-1*newPr},'${formattedDate}','${formattedTime}','${element.username}')`;

                                    db.query(sql, (error, result) => {

                                      if (error) {

                                      } else {

                                      }

                                    })





                                  })

                                }

                              })



                            }

                          })



                        } else {

                          //stock is not present

                          var AmtInvested = (units * price);



                          var sql = `insert into userStocks values('${element.id}','${ident}',${units},${AmtInvested},'${element.username}')`;

                          db.query(sql, (error, result) => {

                            if (error) {

                            } else {

                              //updated in userstocks table

                              //get todays date and time

                              const currentDate = new Date();



                              const year = currentDate.getFullYear();

                              const month = currentDate.getMonth() + 1;

                              const day = currentDate.getDate();



                              const hours = currentDate.getHours();

                              const minutes = currentDate.getMinutes();

                              const seconds = currentDate.getSeconds();



                              const formattedDate = `${day}-${month}-${year}`;

                              const formattedTime = `${hours}:${minutes}:${seconds}`;


                              //put the value in transaction history

                              var sql = `insert into transactionHistory values('${element.id}',${element.units},${-1*newPr},'${formattedDate}','${formattedTime}','${element.username}')`;

                              db.query(sql, (error, result) => {

                                if (error) {

                                } else {

                                }

                              })



                            }

                          })

                        }

                      }

                    })

                  } else {


                  }

                }

              })



            } else {


            }

          } catch (err) {

          }

        }



        await getPriceAndDoOperations();

      }

    }

  });

};


setInterval(() => {

  autoBuy();

}, JobIntervals.AUTO_TRADE_MS);



var autoSell = async function () {


  //traverse through databases and buy if condition is true

  var sql = 'select * from autoSell';

  db.query(sql, async (error, result_data) => {

    if (error) {

    } else {





      //take out the current price of stock from API

      for (const element of result_data) {

        var ident = element.id + StockIdentifiers.EQN_SUFFIX;




        const getPriceNew = async (ident) => {

          try {

            const response = await fetch(

              rapidPriceUrl(StockIndexes.NIFTY_200, ident), {

                headers: rapidHeaders(),

              }

            );



            const data = await response.json();


            return data[0].lastPrice;



          } catch (err) {



          }

        };


        async function getPriceAndDoOperations() {

          try {


            const price = await getPriceNew(ident);




            //if price is higher sell it


            if (price >= element.selected_price) {




              var units = element.units;




              //check for sufficient units


              var sql = `select * from userStocks where username='${element.username}' and id='${element.id}'`;

              db.query(sql, (error, result) => {

                if (error) {

                } else {


                  if (result[0]) {


                    var avlUnits = result[0].units;





                    //if units are sufficient

                    if (element.units <= avlUnits) {


                      //sell it update in userStocks

                      var p = `'` + element.id + `'`;



                      var newUnits = avlUnits - element.units;

                      var amount_gained = element.units * price;

                      var newAmtInvested = result[0].amt_invested - amount_gained;

                      if (newAmtInvested < 0) {

                        newAmtInvested = 0;

                      }

                      //updating userStocks

                      var sql = `update userStocks set units=${newUnits}, amt_invested=${newAmtInvested} where id='${element.id}' and username='${element.username}'`;



                      db.query(sql, (error, result) => {

                        if (error) {

                        } else {


                          //get the balance current from stockuser



                          var sql = `select * from stockuser where username='${element.username}'`;

                          db.query(sql, (error, result) => {

                            if (error) {

                            } else {




                              //update the balance in stockuser

                              var newBal = result[0].amount + amount_gained;

                              var sql = `update stockuser set amount=${newBal} where username='${element.username}'`;

                              db.query(sql, (error, result) => {

                                if (error) {

                                } else {


                                  //delete those stock from userStocks whose units are 0;

                                  var sql = `delete from userStocks where units=0`;

                                  db.query(sql, (error, result) => {

                                    if (error) {

                                    } else {



                                      //delete from autosell

                                      var sql = `delete from autoSell where id='${element.id}' and username='${element.username}' and selected_price='${element.selected_price}'`;

                                      db.query(sql, (error, result) => {

                                        if (error) {

                                        } else {








                                          //get todays date and time

                                          const currentDate = new Date();



                                          const year = currentDate.getFullYear();

                                          const month = currentDate.getMonth() + 1;

                                          const day = currentDate.getDate();



                                          const hours = currentDate.getHours();

                                          const minutes = currentDate.getMinutes();

                                          const seconds = currentDate.getSeconds();



                                          const formattedDate = `${day}-${month}-${year}`;

                                          const formattedTime = `${hours}:${minutes}:${seconds}`;


                                          //put the value in transaction history

                                          var sql = `insert into transactionHistory values('${element.id}',${element.units},${amount_gained},'${formattedDate}','${formattedTime}','${element.username}')`;

                                          db.query(sql, (error, result) => {

                                            if (error) {
                                            }
                                          })



                                        }

                                      })



                                    }

                                  })

                                }

                              })

                            }

                          })

                        }

                      })



                    } else {


                    }

                  } else {


                  }

                }



              })



            } else {


            }

          } catch (err) {

          }

        }



        await getPriceAndDoOperations();

      }

    }

  });

};




setInterval(() => {

  autoSell();

}, JobIntervals.AUTO_TRADE_MS);








app.listen(port, () => {

  Logger.info(`listening to ${port}`);

});

