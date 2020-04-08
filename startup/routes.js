const users = require("../routes/auth");
const groups = require("../routes/groups");
const blogs = require("../routes/blogs");
const reactions = require("../routes/reactions");
const express = require("express");

module.exports = app => {
  app.use(express.json());
  app.use("/users", users);
  app.use("/groups", groups);
  app.use("/blogs", blogs);
  app.use("/reactions", reactions);
};
