const users = require("../routes/auth");
const groups = require("../routes/groups");
const blogs = require("../routes/blogs");
const reactions = require("../routes/reactions");
const comments = require("../routes/comments");
const notifications = require("../routes/notifications");
const chat = require("../routes/chat");
const file = require("../routes/file");
const fileUpload = require("express-fileupload");

module.exports = (app) => {
  app.use(fileUpload());
  app.use("/users", users);
  app.use("/groups", groups);
  app.use("/blogs", blogs);
  app.use("/reactions", reactions);
  app.use("/comments", comments);
  app.use("/notifications", notifications);
  app.use("/chat", chat);
  app.use("/files", file);
};
