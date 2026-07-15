const fetch = require("node-fetch");
const db = require("../database/db");
const {
  StockIndexes,
  StockIdentifiers,
  JobIntervals,
  rapidPriceUrl,
  rapidHeaders,
} = require("../constants/enums");

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













function startAutoTradeJobs() {
  setInterval(() => {
    autoBuy();
  }, JobIntervals.AUTO_TRADE_MS);
  setInterval(() => {
    autoSell();
  }, JobIntervals.AUTO_TRADE_MS);
}

module.exports = { autoBuy, autoSell, startAutoTradeJobs };
