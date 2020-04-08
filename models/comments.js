const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const commentSchema = new Schema({
  userName: {
    type: String,
    ref: "User",
    required: true
  },
  date: {
    type: Date,
    default: Date.now()
  },
  update: {
    type: Date
  },
  content: {
    type: String,
    required: true,
    maxlength: 200
  },
  blogId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Blog",
    required: true
  }
});

const Comment = mongoose.model("Comment", commentSchema);
exports.Comment = Comment;
