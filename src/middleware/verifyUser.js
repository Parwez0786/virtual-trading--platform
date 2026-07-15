const jwt = require("jsonwebtoken");
const { AuthSecrets, CookieNames } = require("../constants/enums");

const verifyUser = (req, res, next) => {
  const cookie = req.cookies[CookieNames.ACCESS_TOKEN];
  if (!cookie) {
    next();
    return;
  }

  jwt.verify(cookie, AuthSecrets.JWT, (err, user) => {
    req.user = user;
    next();
  });
};

exports.verifyUser = verifyUser;
