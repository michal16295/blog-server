const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const messageSchema = new Schema({
  from: {
    type: String,
    ref: "User",
    required: true,
  },
  date: {
    type: Date,
    default: Date.now,
  },
  to: {
    type: String,
    ref: "User",
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  isViewed: {
    type: Boolean,
    default: false,
  },
});

const Message = mongoose.model("Message", messageSchema);
exports.Message = Message;
