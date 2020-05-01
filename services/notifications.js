const { Notification } = require("../models/notification");
const send = require("../socket/socketClient").send;

module.exports.createNotification = async (data) => {
  const notify = new Notification({
    from: data.userName,
    to: data.owner,
    title: data.title,
    link: data.blogId,
    type: data.type,
    content: data.content,
  });
  await notify.save();
  send(`user-notification-response`, notify);
};

module.exports.createNotifications = async (data) => {
  const notify = new Notification({
    from: data.from,
    to: data.to,
    title: data.title,
    link: data.link,
    type: data.type,
    content: data.content,
  });
  send(`user-notification-response`, notify);
  return notify;
};
