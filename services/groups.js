//ADDING MEMBERS
const { Group } = require("../models/groups");
const { Notification } = require("../models/notification");

module.exports.UserGroupCreate = async (owner, data, id) => {
  let flag = false;
  for (let i = 0; i < data.length; i++) {
    if (owner === data[i]) flag = true;
  }
  if (flag === false) data.push(owner);
  let ug = [];
  let notifications = [];
  for (let i = 0; i < data.length; i++) {
    const rel = {
      groupId: id,
      userName: data[i],
    };
    ug.push(rel);
    if (owner !== data[i]) {
      const group = await Group.findById(id);
      const notify = new Notification({
        from: owner,
        to: data[i],
        title: group.title,
        link: id,
        type: "group",
        content: " added you to a group",
      });
      notifications.push(notify);
    }
  }
  await Notification.insertMany(notifications);
  return ug;
};
