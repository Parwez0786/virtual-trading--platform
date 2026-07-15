/**
 * Central enums / frozen constants.
 * Secrets prefer process.env; defaults keep local/dev working.
 */

const AuthSecrets = Object.freeze({
  JWT: process.env.JWT_SECRET || "parwez",
  CRYPTO: process.env.CRYPTO_SECRET || "CIPHERKEY",
  CRYPTO_KEY: process.env.CRYPTO_KEY || "12345",
  SESSION: process.env.SESSION_SECRET || "secret",
  PASSPORT_SESSION: process.env.PASSPORT_SESSION_SECRET || "cats",
});

const TokenConfig = Object.freeze({
  EXPIRES_IN: process.env.JWT_EXPIRES_IN || "15m",
});

const CookieNames = Object.freeze({
  ACCESS_TOKEN: "access_token",
});

const CookieOptions = Object.freeze({
  ACCESS_TOKEN: Object.freeze({ httpOnly: true }),
});

const SessionConfig = Object.freeze({
  MAX_AGE_MS: Number(process.env.SESSION_MAX_AGE_MS || 60000),
  RESAVE: false,
  SAVE_UNINITIALIZED: false,
});

const ServerConfig = Object.freeze({
  PORT: Number(process.env.PORT || 3000),
  HOST: process.env.APP_HOST || "http://localhost",
});

const DbConfig = Object.freeze({
  HOST: process.env.DB_HOST || "127.0.0.1",
  USER: process.env.DB_USER || "root",
  PASSWORD: process.env.DB_PASSWORD || "",
  DATABASE: process.env.DB_NAME || "software_engg",
});

const DbMessages = Object.freeze({
  CONNECT_ERROR: "Error in db connectivity",
  CONNECTED: "connected to database",
});

const SmtpConfig = Object.freeze({
  HOST: process.env.SMTP_HOST || "smtp.gmail.com",
  PORT: Number(process.env.SMTP_PORT || 587),
  SECURE: String(process.env.SMTP_SECURE || "false") === "true",
});

const OAuthScopes = Object.freeze({
  EMAIL: "email",
  PROFILE: "profile",
});

const OAuthConfig = Object.freeze({
  GOOGLE_CLIENT_ID:
    process.env.GOOGLE_CLIENT_ID ||
    "460411624280-31fafqk6s7v232ofgcnj9fbjje3h0f04.apps.googleusercontent.com",
  GOOGLE_CLIENT_SECRET:
    process.env.GOOGLE_CLIENT_SECRET || "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",
  GITHUB_CLIENT_ID: process.env.GITHUB_CLIENT_ID || "87b57950d7826b87d079",
  GITHUB_CLIENT_SECRET:
    process.env.GITHUB_CLIENT_SECRET || "9a2168afe4187ab6754b20ad80576aefc251649b",
  FACEBOOK_CLIENT_ID: process.env.FACEBOOK_CLIENT_ID || "87b57950d7826b87d079",
  FACEBOOK_CLIENT_SECRET:
    process.env.FACEBOOK_CLIENT_SECRET || "9a2168afe4187ab6754b20ad80576aefc251649b",
});

const Routes = Object.freeze({
  AUTH_GOOGLE: "/auth/google",
  AUTH_GOOGLE_CALLBACK: "/google/callback",
  AUTH_GITHUB: "/auth/github",
  AUTH_GITHUB_CALLBACK: "/github/callback",
  AUTH_FACEBOOK: "/auth/facebook",
  AUTH_FACEBOOK_CALLBACK: "/facebook/callback",
  LOGIN: "/api/loginauth/login",
  STOCK_HOME: "/api/showUserStocks/stockHome",
  FORGET_PASSWORD: "/api/auth/forget-password",
  RESET_PASSWORD: "/api/auth/reset-password",
  REGISTER_COMP: "/api/registerauth/register_comp",
  AUTO_BUY_VIEW: "/api/profileauth/autoBuyView",
  AUTO_SELL_VIEW: "/api/profileauth/autoSellView",
  SELL_AUTO_BUY: "/api/sell/autoBuy",
  SELL_AUTO_SELL: "/api/sell/autoSell",
});

const ViewNames = Object.freeze({
  LOGIN: "login",
  REGISTER: "register",
  REGISTER_COMP: "register_comp",
  CONFIRM_REGISTER: "confirm_register",
  FORGET_PASSWORD: "forget-password",
  RESET_PASSWORD: "reset-password",
  USER_LAND: "user_land",
  DELETE: "delete",
  CHANGE_PROFILE: "changeProfile",
  PROFILE_VIEW: "profileView",
  TRANSACTION_HISTORY: "transactionHistory",
  AUTO_BUY_VIEW: "autoBuyView",
  AUTO_SELL_VIEW: "autoSellView",
  SELL_STOCKS: "sellStocks",
  AUTO_BUY: "autoBuy",
  AUTO_SELL: "autoSell",
  HOMEPAGE: "homepage",
  STOCK_DISPLAY: "stock_display",
  HOME2: "home2",
  CONGRATS_MESSAGE: "congrats_message",
  LANDING: "landing",
  SHOW_USER_STOCKS: "showUserStocks",
  STOCK_SELECT: "stockSelect",
  BUY: "buy",
  PRODUCT_DESCRIPTION: "productDescription",
  STOCK_HOME: "stockHome",
  MOST_BOUGHT: "mostBought",
  TOP_GAINERS: "topGainers",
  TOP_LOSERS: "topLosers",
  USER_REVIEW: "userReview",
  ALL_USER_REVIEW: "allUserReview",
  WISHLIST: "wishlist",
});

const FlashKeys = Object.freeze({
  MESSAGE: "message",
  ERROR: "error",
  ERROR_MESSAGE: "errorMessage",
});

const FlashMessages = Object.freeze({
  FILL_REQUIRED: "Please fill in ID, full name, and email",
  REGISTRATION_FAILED: "Registration failed. Please try again.",
  ID_ALREADY_REGISTERED: (id) =>
    `ID "${id}" is already registered. Please sign in or choose another ID.`,
  EMAIL_SEND_FAILED: "Could not send email. Check SMTP settings in .env.",
  EMAIL_SEND_FAILED_GMAIL:
    "Could not send email. Check Gmail App Password in .env",
  AUTH_LINK_SENT: "Authentication link is sent to your gmail",
  AUTH_MAIL_SENT: "Authentication mail is send to your email",
  INVALID_REG_LINK: "Invalid registration link. Please sign up again.",
  INVALID_REG_LINK_SHORT: "Invalid registration link",
  REG_LINK_EXPIRED: "Registration link expired. Please sign up again.",
  REGISTERED_SUCCESS: "Successfully registered. Please sign in.",
  USER_NOT_REGISTERED: "user not registered",
  NO_EMAIL_FOUND: "no  email found",
  ENTER_CUSTID: "please enter  custid",
  USERNAME_PASSWORD_MISMATCH: "username and password does not match",
  VALID_ENROLL: "please enter  valid enroll no",
  VALID_PASSWORD: "please enter valid password",
  USERNAME_NOT_EXIST: "username does not exist",
  ENTER_CORRECT_PASSWORD: "enter correct password",
  SOME_ERROR: "some error occured ",
  PASSWORD_CHANGED: "password changed successfully ",
  UNABLE_TO_RESET: "unable to reset",
  INVALID: "invalid",
  TRY_AGAIN: "Something went wrong. Please try again.",
  DB_ERROR: "Database error. Please try again.",
  ACCOUNT_DELETE_FAILED: "Could not delete account. Please try again.",
  PROFILE_UPDATE_FAILED: "Could not update profile. Please try again.",
  STOCK_FETCH_FAILED: "Could not fetch stock prices. Please refresh.",
  STOCK_DEMO_MODE:
    "Live market APIs are unavailable — showing demo prices for virtual trading.",
  AUTO_ORDER_FAILED: "Could not place auto order. Please try again.",
});

const TradeMessages = Object.freeze({
  UNEXPECTED_ERROR: "Unexpected-error",
  INVALID_CREDENTIAL: "Invalid-Credential",
  INVALID_CREDENTIAL_ALT: "Invalid-creadential",
  SUCCESSFULLY_SOLD: "Successfully sold",
  SUCCESSFULLY_SOLD_TYPO: "succeffully sold",
  INVALID_PASSWORD: "Invalid passwrod",
  INVALID_PASSWORD_ALT: "Invalid-Password",
  INSUFFICIENT_BALANCE: "Insufficient balance",
  INSUFFICIENT_UNITS: "Insufficient units",
  INSUFFICIENT_FUND: "Insufficient-Fund",
  SUCCESSFULLY_ADDED: "sucessfully added",
  WRONG_PASSWORD: "wrong password",
  INVALID_CREDENTIALS: "invalid credentials",
  TRANSACTION_SUCCESS: "Transaction-successfull",
  TRANSACTION_FAIL: "Transaction Unsuccessful",
  USER_NOT_EXIST: "user-not exist",
  WISHLIST_ADDED: "Successfully added to wishlist",
  ACCOUNT_DELETED: "sucesfully deleted",
  INCORRECT_PASSWORD: "Incorrect password",
  USER_ID_NOT_EXIST: "userId does not exist",
});

const StatusMessages = Object.freeze({
  SOMETHING_WRONG: "something went wrong",
  STOCK_DATA_UNAVAILABLE:
    "Stock data not available yet. Please refresh the page.",
});

const EmailTemplates = Object.freeze({
  CONFIRM_SUBJECT: "Confirm your Virtual Trading registration",
  FORGOT_SUBJECT: "Reset your Virtual Trading password",
});

const FormFields = Object.freeze({
  CUST_ID: "custid",
  PASSWORD: "password",
  EMAIL: "email",
  ID: "id",
  FULL_NAME: "fullName",
  MOBILE_NO: "mobileno",
  DOB: "dob",
  PASS: "pass",
  AMOUNT: "amount",
  USER_ID: "userId",
});

const StockIndexes = Object.freeze({
  NIFTY_200: "NIFTY 200",
});

const StockIdentifiers = Object.freeze({
  EQN_SUFFIX: "EQN",
});

const RapidApiConfig = Object.freeze({
  HOST: process.env.RAPIDAPI_HOST || "latest-stock-price.p.rapidapi.com",
  KEY:
    process.env.RAPIDAPI_KEY ||
    "62bd052f8cmsh23bc0917e49ac99p114e72jsn0d060908d7c5",
  KEY_ALT:
    process.env.RAPIDAPI_KEY_ALT ||
    "b50e47636emshec659faa495b4e4p163ca3jsna5ada859cc6e",
  PRICE_PATH: "/price",
});

const AlphaVantageConfig = Object.freeze({
  BASE_URL: "https://www.alphavantage.co/query",
  FUNCTION: "TIME_SERIES_INTRADAY",
  SYMBOL: "IBM",
  INTERVAL: "5min",
  API_KEY: process.env.ALPHAVANTAGE_API_KEY || "9Q7QICP9RWAT4SAS",
});

const RegistrationDefaults = Object.freeze({
  PROFIT: 0,
  LOSS: 0,
});

const JobIntervals = Object.freeze({
  AUTO_TRADE_MS: Number(process.env.AUTO_TRADE_INTERVAL_MS || 1500),
});

const DemoUser = Object.freeze({
  USERNAME: process.env.DEMO_USERNAME || "yasir@arafat",
});

function appBaseUrl() {
  return `${ServerConfig.HOST}:${ServerConfig.PORT}`;
}

function oauthCallbackUrl(path) {
  return `${appBaseUrl()}${path}`;
}

function rapidPriceUrl(index, identifier) {
  // RapidAPI accepts "+" for spaces but rejects "%20" ("API doesn't exists").
  // node-fetch would encode a literal space as %20, so normalize to "+".
  const indices = String(index).replace(/ /g, "+");
  let url = `https://${RapidApiConfig.HOST}${RapidApiConfig.PRICE_PATH}?Indices=${indices}`;
  if (identifier) {
    url += `&Identifier=${encodeURIComponent(identifier)}`;
  }
  return url;
}

function rapidHeaders(useAltKey = false) {
  return {
    "x-rapidapi-host": RapidApiConfig.HOST,
    "x-rapidapi-key": useAltKey ? RapidApiConfig.KEY_ALT : RapidApiConfig.KEY,
  };
}

function alphaVantageUrl() {
  const { BASE_URL, FUNCTION, SYMBOL, INTERVAL, API_KEY } = AlphaVantageConfig;
  return `${BASE_URL}?function=${FUNCTION}&symbol=${SYMBOL}&interval=${INTERVAL}&apikey=${API_KEY}`;
}

module.exports = {
  AuthSecrets,
  TokenConfig,
  CookieNames,
  CookieOptions,
  SessionConfig,
  ServerConfig,
  DbConfig,
  DbMessages,
  SmtpConfig,
  OAuthScopes,
  OAuthConfig,
  Routes,
  ViewNames,
  FlashKeys,
  FlashMessages,
  TradeMessages,
  StatusMessages,
  EmailTemplates,
  FormFields,
  StockIndexes,
  StockIdentifiers,
  RapidApiConfig,
  AlphaVantageConfig,
  RegistrationDefaults,
  JobIntervals,
  DemoUser,
  appBaseUrl,
  oauthCallbackUrl,
  rapidPriceUrl,
  rapidHeaders,
  alphaVantageUrl,
};
