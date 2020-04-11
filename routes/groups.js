const passport = require("passport");
const express = require("express");
const router = express.Router();
const c = require("../common/constants");
const { Group } = require("../models/groups");
const { UserGroup } = require("../models/userGroup");
const { GroupBlog } = require("../models/groupBlog");
const { User } = require("../models/user");
const auth = require("../middlewares/auth");
const mongoose = require("mongoose");
const { searchQuery, getAll, isValid } = require("../services/aggregate");
const { UserGroupCreate } = require("../services/groups");
const ITEMS_PER_PAGE = 3;

//CREATE A GROUP
router.post("/create", [auth], async (req, res) => {
  const { members, title, description, owner, ownerAvatar } = req.body;
  const isExists = await Group.findOne({ title, owner: req.user.userName });
  if (isExists)
    return res.status(c.SERVER_ERROR_HTTP_CODE).json(c.GRUOP_ALREDY_EXIST);
  //GROUP CREATION
  try {
    const group = new Group({
      title,
      description,
      owner,
      ownerAvatar
    });
    await group.save();
    const ug = await UserGroupCreate(owner, members, group._id, ownerAvatar);
    await UserGroup.insertMany(ug);
    return res.status(c.SERVER_OK_HTTP_CODE).send(group);
  } catch (ex) {
    return res.status(c.SERVER_ERROR_HTTP_CODE).send(ex.message);
  }
});
// GET GROUP BY ID
router.get("/:id", [auth], async (req, res) => {
  const group = await Group.findById(req.params.id);
  if (!group)
    return res.status(c.SERVER_NOT_FOUND_HTTP_CODE).json(c.GROUP_NOT_FOUND);
  return res.status(c.SERVER_OK_HTTP_CODE).send(group);
});

//DELETE A GROUP
router.delete("/delete/:groupId", [auth], async (req, res) => {
  const group = await Group.findById(req.params.groupId);
  if (!group)
    return res.status(c.SERVER_NOT_FOUND_HTTP_CODE).json(c.GROUP_NOT_FOUND);
  const user = await User.findById(req.user._id);
  if (group.owner.toString() !== user.userName)
    return res.status(c.NOT_AUTHORIZED_HTTP_CODE).json(c.INVALID_TOKEN_ERROR);
  await UserGroup.deleteMany({ groupId: req.params.groupId });
  await GroupBlog.deleteMany({ groupId: req.params.groupId });
  await Group.findOneAndDelete({ _id: req.params.groupId });
  return res.status(c.SERVER_OK_HTTP_CODE).json("Group deleted successfully");
});

//EDIT A GROUP
router.put("/edit", [auth], async (req, res) => {
  const group = await Group.findById(req.body.groupId);
  if (!group) res.status(c.SERVER_NOT_FOUND_HTTP_CODE).json(c.GROUP_NOT_FOUND);
  if (group.owner !== req.user.userName) {
    return res.status(c.NOT_AUTHORIZED_HTTP_CODE).json(c.INVALID_TOKEN_ERROR);
  }
  const newGroup = {
    title: req.body.title,
    description: req.body.description
  };
  await Group.updateOne({ _id: req.body.groupId }, { $set: newGroup });
  return res.status(c.SERVER_OK_HTTP_CODE).json("Group updated successfully");
});

//DELETE A USER FROM A GROUP
router.delete("/removeMember/:groupId/:member", [auth], async (req, res) => {
  const { groupId, member } = req.params;
  const group = await Group.findById(groupId);
  if (!group) res.status(c.SERVER_NOT_FOUND_HTTP_CODE).json(c.GROUP_NOT_FOUND);
  const userGroup = await UserGroup.findOne({
    groupId: groupId,
    userName: member
  });
  if (!userGroup)
    res.status(c.SERVER_NOT_FOUND_HTTP_CODE).json("User Not In This Group!");
  await UserGroup.findOneAndDelete({ groupId: groupId, userName: member });
  return res.status(c.SERVER_OK_HTTP_CODE).json("Member Removed Successfully");
});

//ADD A MEMBER TO A GROUP
router.post("/addMember/:groupId/:member", [auth], async (req, res) => {
  const { groupId, member } = req.params;
  const group = await Group.findById(groupId);
  if (!group)
    return res.status(c.SERVER_NOT_FOUND_HTTP_CODE).json(c.GROUP_NOT_FOUND);
  if (group.owner !== req.user.userName)
    return res.status(c.NOT_AUTHORIZED_HTTP_CODE).json(c.INVALID_TOKEN_ERROR);
  const userGroup = await UserGroup.findOne({
    groupId: groupId,
    userName: member
  });
  if (userGroup)
    return res
      .status(c.SERVER_ERROR_HTTP_CODE)
      .json(c.USER_ALREADY_IN_THE_GROUP);
  const ug = new UserGroup({
    groupId: groupId,
    userName: member
  });
  await ug.save();
  return res.status(c.SERVER_OK_HTTP_CODE).json("Member Added successfully");
});

//ALL GROUPS
router.get("/all/:page", async (req, res) => {
  let search = req.query.search;
  if (search === "undefined") {
    search = "";
  }
  const cusrrentPage = parseInt(req.params.page) || 1;
  const offset = ITEMS_PER_PAGE * (cusrrentPage - 1);
  const groups = await getAll(Group, search, offset, ITEMS_PER_PAGE, "title");
  if (isValid(groups))
    return res.status(c.SERVER_NOT_FOUND_HTTP_CODE).json(c.GROUP_NOT_FOUND);
  return res.status(c.SERVER_OK_HTTP_CODE).send(groups);
});

//ALL GROUPS OF A GIVEN USER
router.get("/all/:page/:userName", async (req, res) => {
  let search = req.query.search;
  if (search === "undefined") {
    search = "";
  }
  const cusrrentPage = parseInt(req.params.page) || 1;
  const offset = ITEMS_PER_PAGE * (cusrrentPage - 1);
  const usersGroups = await UserGroup.find({ userName: req.params.userName });
  const groupIds = usersGroups.map(id => id.groupId);
  const groups = await searchQuery(
    Group,
    groupIds,
    search,
    offset,
    ITEMS_PER_PAGE,
    "title",
    "_id"
  );
  if (isValid(groups))
    return res.status(c.SERVER_NOT_FOUND_HTTP_CODE).json(c.GROUP_NOT_FOUND);
  return res.status(c.SERVER_OK_HTTP_CODE).send(groups);
});
//ALL USERS OF A GIVEN GROUP
router.get("/members/:page/:groupId", async (req, res) => {
  let search = req.query.search;
  if (search === "undefined") {
    search = "";
  }
  const group = await Group.findById(req.params.groupId);
  const cusrrentPage = parseInt(req.params.page) || 1;
  const offset = ITEMS_PER_PAGE * (cusrrentPage - 1);
  const usersGroups = await UserGroup.find({ groupId: req.params.groupId });
  const userNames = usersGroups.map(i => i.userName);
  userNames.splice(userNames.indexOf(group.owner), 1);
  const members = await searchQuery(
    User,
    userNames,
    search,
    offset,
    ITEMS_PER_PAGE,
    "firstName",
    "userName"
  );

  if (isValid(members))
    return res.status(c.SERVER_NOT_FOUND_HTTP_CODE).json(c.USER_NOT_FOUND);
  return res.status(c.SERVER_OK_HTTP_CODE).send(members);
});

module.exports = router;
