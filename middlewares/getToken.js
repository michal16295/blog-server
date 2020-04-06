const jwt = require("jsonwebtoken");
const key = require("../config/keys");

//GET TOKEN
module.exports.getToken = function(req, res, next) {
  try {
    const token = req.header("x-auth-token");
    if (token === undefined) return false;
    try {
      const decoded = jwt.verify(token, key.cookieKey);
      req.user = decoded;

      return true;
    } catch (ex) {
      res.status(400).send("Invalid token.");
    }
  } catch (ex) {
    return false;
  }
};
