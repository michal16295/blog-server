//ADDING MEMBERS
const { Group } = require("../models/groups");
module.exports.relCreation = async (owner, data, field2, field1, id) => {
  let flag = false;
  for (let i = 0; i < data.length; i++) {
    if (owner === data[i]) flag = true;
  }
  if (flag === false) data.push(owner);
  let ug = [];
  for (let i = 0; i < data.length; i++) {
    const rel = {
      [field1]: id,
      [field2]: data[i]
    };
    ug.push(rel);
  }
  return ug;
};
//BLOG GROUP RELATION
module.exports.blogGroupRel = async (groups, id) => {
  let ub = [];
  for (let i = 0; i < groups.length; i++) {
    const group = await Group.findOne({ title: groups[i] });
    const rel = {
      groupId: group._id,
      blogId: id
    };
    ub.push(rel);
  }
  return ub;
};
module.exports.updateAvatar = async (db, user, avatar) => {
  await db.updateMany({ owner: user }, { $set: { ownerAvatar: avatar } });
};
