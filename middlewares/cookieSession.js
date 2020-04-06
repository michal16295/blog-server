const passport = require("passport");
const keys = require("../config/keys");
const cookieSession = require("cookie-session");
const bodyParser = require("body-parser");

module.exports = app => {
  app.use(bodyParser.json());
  app.use(
    cookieSession({
      maxAge: 30 * 24 * 60 * 1000,
      keys: [keys.cookieKey]
    })
  );
  app.use(passport.initialize());
  app.use(passport.session());
};
