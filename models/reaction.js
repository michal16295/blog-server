const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const reactiontSchema = new Schema({
  userName: {
    type: String,
    ref: "User",
    required: true,
  },
  date: {
    type: Date,
    default: Date.now,
  },
  type: {
    type: String,
    enum: ["like", "love", "angry", "sad", "wow", "haha"],
    required: true,
  },
  blogId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Blog",
    required: true,
  },
});

const Reaction = mongoose.model("Reaction", reactiontSchema);
exports.Reaction = Reaction;
