const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const userGroupSchema = new Schema({
  userName: {
    type: String,
    ref: "User",
    required: true
  },
  groupId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Group",
    required: true
  }
});

const UserGroup = mongoose.model("UserGroup", userGroupSchema);
exports.UserGroup = UserGroup;
