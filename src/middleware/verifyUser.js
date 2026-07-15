const jwt = require("jsonwebtoken");
const { AuthSecrets, CookieNames, Routes } = require("../constants/enums");

const verifyUser = (req, res, next) => {
  const cookie = req.cookies[CookieNames.ACCESS_TOKEN];
  if (!cookie) {
    return next();
  }

  jwt.verify(cookie, AuthSecrets.JWT, (err, user) => {
    if (!err && user) {
      req.user = user;
    }
    next();
  });
};

const requireUser = (req, res, next) => {
  const cookie = req.cookies[CookieNames.ACCESS_TOKEN];
  if (!cookie) {
    return res.redirect(Routes.LOGIN);
  }

  jwt.verify(cookie, AuthSecrets.JWT, (err, user) => {
    if (err || !user) {
      return res.redirect(Routes.LOGIN);
    }
    req.user = user;
    next();
  });
};

exports.verifyUser = verifyUser;
exports.requireUser = requireUser;
