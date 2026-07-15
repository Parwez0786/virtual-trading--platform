const fetch = require("node-fetch");
const yahooFinance = require("yahoo-finance2").default;
const {
  StockIndexes,
  StockIdentifiers,
  rapidHeaders,
  rapidPriceUrl,
} = require("../constants/enums");

const NSE_WATCHLIST = [
  "RELIANCE",
  "TCS",
  "HDFCBANK",
  "INFY",
  "ICICIBANK",
  "HINDUNILVR",
  "ITC",
  "SBIN",
  "BHARTIARTL",
  "KOTAKBANK",
  "LT",
  "AXISBANK",
  "BAJFINANCE",
  "ASIANPAINT",
  "MARUTI",
  "SUNPHARMA",
  "TITAN",
  "WIPRO",
  "ULTRACEMCO",
  "NESTLEIND",
];

function demoRow(symbol, lastPrice, change, volume) {
  const previousClose = lastPrice - change;
  const pChange = previousClose ? (change / previousClose) * 100 : 0;
  return {
    identifier: `${symbol}${StockIdentifiers.EQN_SUFFIX}`,
    symbol,
    companyName: symbol,
    open: previousClose,
    dayHigh: lastPrice + Math.abs(change),
    dayLow: lastPrice - Math.abs(change),
    lastPrice,
    previousClose,
    change,
    pChange,
    totalTradedVolume: volume,
    totalTradedValue: volume * lastPrice,
    lastUpdateTime: new Date().toLocaleString(),
    yearHigh: lastPrice * 1.2,
    yearLow: lastPrice * 0.8,
    perChange365d: pChange * 12,
    perChange30d: pChange * 2,
    _source: "demo",
  };
}

function getDemoIndex() {
  return [
    demoRow("RELIANCE", 2924.5, 18.2, 4200000),
    demoRow("TCS", 4156.0, -22.4, 1800000),
    demoRow("HDFCBANK", 1688.3, 9.1, 5100000),
    demoRow("INFY", 1882.75, 12.6, 3900000),
    demoRow("ICICIBANK", 1284.2, -6.4, 6100000),
    demoRow("ITC", 468.9, 3.2, 7200000),
    demoRow("SBIN", 842.15, 5.8, 8900000),
    demoRow("BHARTIARTL", 1598.4, 14.0, 2500000),
    demoRow("LT", 3642.0, -11.5, 980000),
    demoRow("AXISBANK", 1196.55, 7.3, 4300000),
    demoRow("BAJFINANCE", 7240.0, 45.0, 760000),
    demoRow("ASIANPAINT", 2895.25, -8.75, 650000),
    demoRow("MARUTI", 12580.0, 62.0, 340000),
    demoRow("SUNPHARMA", 1722.4, 4.1, 1100000),
    demoRow("TITAN", 3468.9, -15.2, 890000),
    demoRow("WIPRO", 545.6, 2.4, 5200000),
    demoRow("ULTRACEMCO", 11240.0, 38.0, 210000),
    demoRow("NESTLEIND", 2415.0, -6.5, 480000),
    demoRow("HINDUNILVR", 2688.0, 9.8, 1400000),
    demoRow("KOTAKBANK", 1788.25, -4.75, 2200000),
  ];
}

async function getYahooPrice(symbol) {
  try {
    const ticker = symbol.includes(".") ? symbol : `${symbol}.NS`;
    const quote = await yahooFinance.quote(ticker);
    return quote.regularMarketPrice;
  } catch (error) {
    return undefined;
  }
}

function mapYahooQuote(quote) {
  const raw = String(quote.symbol || "").replace(/\.NS$/i, "");
  const lastPrice = quote.regularMarketPrice ?? 0;
  const previousClose = quote.regularMarketPreviousClose ?? lastPrice;
  const change = quote.regularMarketChange ?? lastPrice - previousClose;
  const pChange =
    quote.regularMarketChangePercent ??
    (previousClose ? (change / previousClose) * 100 : 0);

  return {
    identifier: `${raw}${StockIdentifiers.EQN_SUFFIX}`,
    symbol: raw,
    companyName: quote.shortName || quote.longName || raw,
    open: quote.regularMarketOpen ?? lastPrice,
    dayHigh: quote.regularMarketDayHigh ?? lastPrice,
    dayLow: quote.regularMarketDayLow ?? lastPrice,
    lastPrice,
    previousClose,
    change,
    pChange,
    totalTradedVolume: quote.regularMarketVolume ?? 0,
    totalTradedValue: (quote.regularMarketVolume ?? 0) * lastPrice,
    lastUpdateTime: quote.regularMarketTime
      ? new Date(quote.regularMarketTime * 1000).toLocaleString()
      : new Date().toLocaleString(),
    yearHigh: quote.fiftyTwoWeekHigh ?? lastPrice,
    yearLow: quote.fiftyTwoWeekLow ?? lastPrice,
    perChange365d: 0,
    perChange30d: 0,
    _source: "yahoo",
  };
}

async function fetchYahooIndex() {
  const tickers = NSE_WATCHLIST.map((s) => `${s}.NS`);
  try {
    const quotes = await yahooFinance.quote(tickers);
    const list = Array.isArray(quotes) ? quotes : [quotes];
    return list.filter(Boolean).map(mapYahooQuote);
  } catch (error) {
    return [];
  }
}

async function getRapidPrice(symbol, { useAltKey = false } = {}) {
  try {
    const identifier = `${symbol}${StockIdentifiers.EQN_SUFFIX}`;
    const response = await fetch(
      rapidPriceUrl(StockIndexes.NIFTY_200, identifier),
      { headers: rapidHeaders(useAltKey) }
    );
    if (!response.ok) return undefined;
    const data = await response.json();
    if (!Array.isArray(data) || !data[0]) return undefined;
    return data[0].lastPrice;
  } catch (error) {
    return getYahooPrice(symbol);
  }
}

async function fetchNiftyIndex(useAltKey = true) {
  const attemptRapid = async (alt) => {
    const response = await fetch(rapidPriceUrl(StockIndexes.NIFTY_200), {
      headers: rapidHeaders(alt),
    });
    if (!response.ok) return null;
    const data = await response.json();
    return Array.isArray(data) && data.length ? data : null;
  };

  try {
    const rapid =
      (await attemptRapid(useAltKey)) || (await attemptRapid(!useAltKey));
    if (rapid && rapid.length) return rapid;
  } catch (_) {
    /* continue */
  }

  const yahoo = await fetchYahooIndex();
  if (yahoo.length) return yahoo;

  // Live providers unavailable: keep the UI usable for virtual trading.
  return getDemoIndex();
}

module.exports = {
  getYahooPrice,
  getRapidPrice,
  fetchNiftyIndex,
  fetchYahooIndex,
  getDemoIndex,
};
