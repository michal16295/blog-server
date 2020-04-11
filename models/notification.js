const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const notificationSchema = new Schema({
  from: {
    type: String,
    ref: "User",
    required: true
  },
  date: {
    type: Date,
    default: Date.now()
  },
  to: {
    type: String,
    ref: "User",
    required: true
  },
  content: {
    type: String,
    required: true,
    maxlength: 200
  },
  isViewed: {
    type: Boolean,
    default: false
  },
  senderAvatar: {
    type: String
  },
  type: {
    type: String
  },
  link: {
    type: String
  },
  title: {
    type: String
  }
});

const Notification = mongoose.model("Notification", notificationSchema);
exports.Notification = Notification;
