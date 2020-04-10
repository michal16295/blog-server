const mongoose = require("mongoose");
const { Schema } = mongoose;
const jwt = require("jsonwebtoken");
const config = require("../config/keys");

const userSchema = new Schema({
  googleId: String,
  email: String,
  firstName: String,
  lastName: String,
  password: String,
  avatar: String,
  userName: {
    type: String,
    unique: true
  }
});

userSchema.methods.generateAuthToken = function() {
  const token = jwt.sign(
    { _id: this._id, userName: this.userName, avatar: this.avatar },
    config.cookieKey
  );
  return token;
};

const User = mongoose.model("User", userSchema);
exports.User = User;
