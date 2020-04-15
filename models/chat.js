const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const chatSchema = new Schema({
  user1: {
    type: String,
    ref: "User",
    required: true,
  },
  date: {
    type: Date,
    default: Date.now,
  },
  user2: {
    type: String,
    ref: "User",
    required: true,
  },
  isViewed: {
    type: Boolean,
    default: false,
  },
  message: {
    type: String,
    required: true,
  },
});

const Chat = mongoose.model("Chat", chatSchema);
exports.Chat = Chat;
