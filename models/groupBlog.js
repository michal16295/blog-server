const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const groupBlogSchema = new Schema({
  groupId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Group",
    required: true
  },
  blogId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Blog",
    required: true
  }
});

const GroupBlog = mongoose.model("GroupBlog", groupBlogSchema);
exports.GroupBlog = GroupBlog;
