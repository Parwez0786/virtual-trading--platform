const express = require("express");
const path = require("path");
const hbs = require("hbs");
const cookieParser = require("cookie-parser");
const session = require("express-session");
const flash = require("connect-flash");
const passport = require("passport");
const { AuthSecrets, SessionConfig } = require("./constants/enums");

function createApp() {
  const app = express();
  const staticPath = path.join(__dirname, "../public");
  const partialPath = path.join(__dirname, "../templates/partials");
  const templatePath = path.join(__dirname, "../templates/views");

  app.set("view engine", "hbs");
  app.set("views", templatePath);
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());
  app.use(express.static(staticPath));
  hbs.registerPartials(partialPath);
  app.use(session({
    secret: AuthSecrets.SESSION,
    cookie: { maxAge: SessionConfig.MAX_AGE_MS },
    resave: SessionConfig.RESAVE,
    saveUninitialized: SessionConfig.SAVE_UNINITIALIZED,
  }));
  app.use(flash());
  require("./auth");
  app.use(passport.initialize());
  app.use(passport.session());
  require("./routes")(app);
  return app;
}

module.exports = createApp;
