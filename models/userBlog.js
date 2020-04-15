const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const userBlogSchema = new Schema({
  userName: {
    type: String,
    ref: "User",
    required: true,
  },

  blogId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Blog",
    required: true,
  },
});

const UserBlog = mongoose.model("UserBlog", userBlogSchema);
exports.UserBlog = UserBlog;
