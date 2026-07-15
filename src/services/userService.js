const db = require("./db");

function query(sql, values) {
  return new Promise((resolve, reject) => {
    db.query(sql, values, (error, results) => {
      if (error) {
        reject(error);
        return;
      }
      resolve(results);
    });
  });
}

function findStockUserByUsername(username) {
  return query("SELECT * FROM stockuser WHERE username = ?", [username]);
}

async function deleteUserCascade(username) {
  const tables = [
    "wishlist",
    "autoSell",
    "reviews",
    "transactionHistory",
    "userStocks",
    "autoBuy",
    "stockuser",
  ];

  for (const table of tables) {
    await query(`DELETE FROM ${table} WHERE username = ?`, [username]);
  }
}

module.exports = { findStockUserByUsername, deleteUserCascade };
