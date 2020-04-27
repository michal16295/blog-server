const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const settingsSchema = new Schema({
  user: {
    type: String,
    ref: "User",
    required: true,
  },
  web: {
    type: Array,
  },
  email: {
    type: Array,
  },
});

const Settings = mongoose.model("Settings", settingsSchema);
exports.Settings = Settings;
