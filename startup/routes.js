const users = require("../routes/auth");
const groups = require("../routes/groups");
const blogs = require("../routes/blogs");
const express = require("express");

module.exports = app => {
  app.use(express.json());
  app.use("/users", users);
  app.use("/groups", groups);
  app.use("/blogs", blogs);
};
