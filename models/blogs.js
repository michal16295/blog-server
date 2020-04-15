const mongoose = require("mongoose");
const { Schema } = mongoose;

const blogSchema = new Schema({
  title: {
    type: String,
    minlength: 2,
    required: true,
  },
  description: {
    type: String,
    maxlength: 10000,
  },
  date: {
    type: Date,
    default: Date.now,
  },
  owner: {
    type: String,
    required: true,
    ref: "User",
  },
  permission: {
    type: String,
    enum: ["private", "public"],
    required: true,
  },
  tags: {
    type: Array,
    minlength: 1,
    maxlength: 10,
  },
});

const Blog = mongoose.model("Blog", blogSchema);
exports.Blog = Blog;
