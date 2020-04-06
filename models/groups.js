const mongoose = require("mongoose");
const { Schema } = mongoose;

const groupSchema = new Schema({
  title: {
    type: String,
    minlength: 2,
    required: true
  },
  description: {
    type: String,
    maxlength: 200
  },
  date: {
    type: Date,
    default: Date.now()
  },
  owner: {
    type: String,
    required: true,
    ref: "User"
  },
  ownerAvatar: {
    type: String
  }
});

const Group = mongoose.model("Group", groupSchema);
exports.Group = Group;
