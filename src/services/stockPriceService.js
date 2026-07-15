const fetch = require("node-fetch");
const yahooFinance = require("yahoo-finance2").default;
const {
  StockIndexes,
  StockIdentifiers,
  rapidHeaders,
  rapidPriceUrl,
} = require("../constants/enums");

async function getYahooPrice(symbol) {
  try {
    const quote = await yahooFinance.quote(symbol);
    return quote.regularMarketPrice;
  } catch (error) {
    return undefined;
  }
}

async function getRapidPrice(symbol, { useAltKey = false } = {}) {
  try {
    const identifier = `${symbol}${StockIdentifiers.EQN_SUFFIX}`;
    const response = await fetch(
      rapidPriceUrl(StockIndexes.NIFTY_200, identifier),
      { headers: rapidHeaders(useAltKey) }
    );
    const data = await response.json();
    return data[0].lastPrice;
  } catch (error) {
    return undefined;
  }
}

module.exports = { getYahooPrice, getRapidPrice };
