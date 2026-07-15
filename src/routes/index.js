const passport = require("passport");
const request = require("request");
const isLoggedIn = require("../middleware/isLoggedIn");
const {
  Routes,
  ViewNames,
  StatusMessages,
  OAuthScopes,
  FlashKeys,
  alphaVantageUrl,
} = require("../constants/enums");

module.exports = function registerRoutes(app) {
  app.get(Routes.AUTH_GOOGLE, passport.authenticate("google", {
    scope: [OAuthScopes.EMAIL, OAuthScopes.PROFILE],
  }));
  app.get(Routes.AUTH_GOOGLE_CALLBACK, passport.authenticate("google", {
    successRedirect: "/student_profile",
    failureRedirect: "/auth/failure",
  }));
  app.get(Routes.AUTH_GITHUB, passport.authenticate("github", {
    scope: [OAuthScopes.EMAIL, OAuthScopes.PROFILE],
  }));
  app.get(Routes.AUTH_GITHUB_CALLBACK, passport.authenticate("github", {
    successRedirect: "/homepage",
    failureRedirect: "/auth/failure",
  }));
  app.get(Routes.AUTH_FACEBOOK, passport.authenticate("facebook", {
    scope: [OAuthScopes.EMAIL, OAuthScopes.PROFILE],
  }));
  app.get(Routes.AUTH_FACEBOOK_CALLBACK, passport.authenticate("facebook", {
    successRedirect: "/homepage",
    failureRedirect: "/auth/failure",
  }));

  app.get("/auth/failure", (req, res) => res.send(StatusMessages.SOMETHING_WRONG));
  app.get("/protected", isLoggedIn, (req, res) => res.send(`hello ${req.user.email}`));
  app.get("/logout", (req, res) => {
    req.logOut();
    req.session.destroy();
    res.render(ViewNames.HOMEPAGE);
  });
  app.get("/stock_display", (req, res) => res.render(ViewNames.STOCK_DISPLAY));
  app.get("/homepage", isLoggedIn, (req, res) => {
    const profile_pic = req.user.picture == null
      ? req.user.photos[0].value
      : req.user.picture;
    res.render(ViewNames.HOMEPAGE, { email: req.user.email, picture: profile_pic });
  });
  app.get("/home2", (req, res) => {
    res.render(ViewNames.HOME2, { message: req.flash(FlashKeys.MESSAGE) });
  });
  app.get("/congrats_message", (req, res) => {
    res.render(ViewNames.CONGRATS_MESSAGE, {
      genereted_account_no: req.query.account || null,
      message: req.query.message || req.flash(FlashKeys.MESSAGE),
      type: "success",
    });
  });

  app.use("/api/auth", require("../router/auth"));
  app.use("/api/registerauth", require("../router/registerauth"));
  app.use("/api/profileauth", require("../router/profileauth"));
  app.use("/api/showUserStocks", require("../router/showUserStocks"));
  app.use("/api/loginauth", require("../router/loginauth"));
  app.use("/api/sell", require("../router/sell"));

  app.get("/get_data", async (req, res) => {
    request.get({
      url: alphaVantageUrl(),
      json: true,
      headers: { "User-Agent": "request" },
    }, (err, response, data) => {
      if (err || response.statusCode !== 200) {
        return res.status(502).json({ error: StatusMessages.SOMETHING_WRONG });
      }
      const data2 = Object.entries(data).map(([key, value]) => ({ [key]: value }))[0]["Meta Data"];
      const newData = {};
      for (const key in data2) newData[key.split(" ")[1]] = data2[key];
      res.status(200).json(newData);
    });
  });
  app.get("/landing", (req, res) => res.render(ViewNames.LANDING));
};
