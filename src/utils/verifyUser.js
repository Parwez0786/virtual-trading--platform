const jwt = require("jsonwebtoken");
const {
  AuthSecrets,
  CookieNames,
} = require("../constants/enums");

const verifyUser = (req, res, next) => {
  let cookie = req.cookies[CookieNames.ACCESS_TOKEN];
  if (!cookie) next();
  jwt.verify(cookie, AuthSecrets.JWT, (err, user) => {
    req.user = user;
    next();
  });
};

exports.verifyUser = verifyUser;
