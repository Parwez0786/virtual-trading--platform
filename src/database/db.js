var mysql = require("mysql2");
const { DbConfig, DbMessages } = require("../constants/enums");
const Logger = require("../utils/logger");

var db = mysql.createConnection({
  host: DbConfig.HOST,
  user: DbConfig.USER,
  password: DbConfig.PASSWORD,
  database: DbConfig.DATABASE,
});

db.connect(function (err) {
  if (err) {
    Logger.error(DbMessages.CONNECT_ERROR);
  } else {
    Logger.info(DbMessages.CONNECTED);
  }
});

module.exports = db;
