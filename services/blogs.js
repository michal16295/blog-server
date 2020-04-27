const { UserGroup } = require("../models/userGroup");
const { UserBlog } = require("../models/userBlog");
const { GroupBlog } = require("../models/groupBlog");
const { Blog } = require("../models/blogs");
const { Notification } = require("../models/notification");
const { Settings } = require("../models/settings");
const ITEMS_PER_PAGE = 3;

module.exports.blogGroupRel = async (groups, id) => {
  let ub = [];
  for (let i = 0; i < groups.length; i++) {
    const group = await Group.findOne({ title: groups[i] });
    const rel = {
      groupId: group._id,
      blogId: id,
    };
    ub.push(rel);
  }
  return ub;
};

module.exports.UserBlogCreation = async (owner, data, id) => {
  let flag = false;
  for (let i = 0; i < data.length; i++) {
    if (owner === data[i]) flag = true;
  }
  if (flag === false) data.push(owner);
  let ug = [];
  let notifications = [];
  for (let i = 0; i < data.length; i++) {
    const rel = {
      blogId: id,
      userName: data[i],
    };
    ug.push(rel);
    if (owner !== data[i]) {
      const blog = await Blog.findById(id);
      const settings = await Settings.findOne({ user: data[i] });
      if (settings.web.includes("blogs")) {
        const notify = new Notification({
          from: owner,
          to: data[i],
          title: blog.title,
          link: id,
          type: "blog",
          content: " added you to a post",
        });
        notifications.push(notify);
      }
    }
  }
  await Notification.insertMany(notifications);
  return ug;
};

module.exports.getOwnersBlogs = async (search, offset, userName) => {
  const data = await Blog.aggregate([
    {
      $match: {
        title: { $regex: search, $options: "i" },
        owner: userName,
      },
    },
    {
      $sort: { date: -1 },
    },
    {
      $facet: this.facet(offset),
    },
  ]);
  return data;
};
module.exports.getAllBlogs = async (search, offset, currentUser) => {
  let blogs = await this.authBlogs(currentUser);
  let matchObj = this.searchObj(search);
  const data = await Blog.aggregate([
    {
      $match: matchObj,
    },
    {
      $match: {
        _id: { $in: blogs },
      },
    },
    {
      $sort: { date: -1 },
    },
    {
      $facet: this.facet(offset),
    },
  ]);
  return data;
};
module.exports.getUsersBlogs = async (
  search,
  offset,
  userName,
  currentUser
) => {
  let blogs = await this.authBlogs(currentUser);
  const data = await Blog.aggregate([
    {
      $match: {
        title: { $regex: search, $options: "i" },
        $or: [
          {
            permission: "public",
            owner: userName,
          },
          {
            owner: userName,
            _id: { $in: blogs },
          },
        ],
      },
    },
    {
      $sort: { date: -1 },
    },
    {
      $facet: this.facet(offset),
    },
  ]);
  return data;
};
module.exports.getPublicBlogs = async (search, offset) => {
  const data = await Blog.aggregate([
    {
      $match: {
        title: { $regex: search, $options: "i" },
        permission: "public",
      },
    },
    {
      $sort: { date: -1 },
    },
    {
      $facet: this.facet(offset),
    },
  ]);
  return data;
};
module.exports.authBlogs = async (currentUser) => {
  //current user groups
  let userGroups = await UserGroup.find({ userName: currentUser });
  userGroups = userGroups.map((i) => i.groupId);

  //blogs the current user can view
  let userBlogs = await UserBlog.find({ userName: currentUser });
  userBlogs = userBlogs.map((i) => i.blogId);

  let groupBlogs = await GroupBlog.aggregate([
    {
      $match: {
        groupId: { $in: userGroups },
      },
    },
  ]);
  //public blogs
  let publicBlogs = await Blog.find({ permission: "public" });
  publicBlogs = publicBlogs.map((i) => i._id);

  groupBlogs = groupBlogs.map((i) => i.blogId);
  let blogs = userBlogs.concat(groupBlogs);
  blogs = blogs.concat(publicBlogs);
  return blogs;
};
module.exports.searchObj = (search) => {
  // Match object to aggregate with
  // Set it to match with name regex
  let matchObject = {};
  if (search.length > 1 && search.includes("#")) {
    matchObject.tags = search.split("#")[1].toLowerCase();
  } else {
    matchObject = {
      title: {
        $regex: search,
        $options: "i",
      },
    };
  }
  return matchObject;
};
module.exports.facet = (offset) => {
  let obj = {
    metadata: [
      { $count: "total" },
      { $addFields: { ITEMS_PER_PAGE: ITEMS_PER_PAGE } },
    ],
    data: [{ $skip: offset }, { $limit: ITEMS_PER_PAGE }],
  };
  return obj;
};
module.exports.isValid = (db) => {
  return !db[0].data || db[0].data.length === 0 || db[0].data === undefined;
};
module.exports.isAuthotrized = async (blogId, userName) => {
  let users = await UserBlog.findOne({ blogId, userName });
  let groups = await GroupBlog.find({ blogId });
  let userGroups = [];
  for (var i = 0; i < groups.length; i++) {
    userGroups.push(
      await UserGroup.findOne({ groupId: groups[i]._id, userName })
    );
  }
  if (userGroups.length === 0 && !users) return false;
  return true;
};
