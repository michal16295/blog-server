const passport = require("passport");
const express = require("express");
const router = express.Router();
const c = require("../common/constants");
const { Group } = require("../models/groups");
const { Blog } = require("../models/blogs");
const { UserBlog } = require("../models/userBlog");
const { GroupBlog } = require("../models/groupBlog");
const { UserGroup } = require("../models/userGroup");
const { User } = require("../models/user");
const auth = require("../middlewares/auth");
const mongoose = require("mongoose");
const { getToken } = require("../middlewares/getToken");
const {
  getAllBlogs,
  isValid,
  getOwnersBlogs,
  getUsersBlogs,
  getPublicBlogs,
  isAuthotrized,
  UserBlogCreation,
  blogGroupRel
} = require("../services/blogs");
const ITEMS_PER_PAGE = 3;

//GET BLOG BY ID
router.get("/getPost/:postId", async (req, res) => {
  const { postId } = req.params;
  try {
    const blog = await Blog.findById(postId);
    const token = getToken(req, res);
    if (blog.permission === "private") {
      if (!token)
        return res
          .status(c.NOT_AUTHORIZED_HTTP_CODE)
          .send(c.INVALID_TOKEN_ERROR);
      if (!(await isAuthotrized(blog._id, req.user.userName)))
        return res
          .status(c.NOT_AUTHORIZED_HTTP_CODE)
          .send(c.INVALID_TOKEN_ERROR);
    }
    let groupsId = await GroupBlog.find({ blogId: postId });
    groupsId = groupsId.map(i => i.groupId);
    let groups = [];
    for (var i = 0; i < groupsId.length; i++) {
      let group = await Group.findById(groupsId[i]);
      groups.push(group.title);
    }
    let users = await UserBlog.find({ blogId: postId });
    users = users.map(i => i.userName);

    const response = {
      blog,
      users,
      groups
    };
    return res.status(c.SERVER_OK_HTTP_CODE).send(response);
  } catch (err) {
    return res.status(c.SERVER_NOT_FOUND_HTTP_CODE).json("Post Not Found");
  }
});

//CREATE BLOG
router.post("/create", [auth], async (req, res) => {
  //BLOG CREATION
  const blog = new Blog({
    title: req.body.title,
    description: req.body.description,
    owner: req.body.owner,
    permission: req.body.permission,
    tags: req.body.tags,
    ownerAvatar: req.user.avatar
  });
  await blog.save();
  if (req.body.permission === "private") {
    const userBlog = await UserBlogCreation(
      req.body.owner,
      req.body.members,
      blog._id,
      req.user.avatar
    );
    await UserBlog.insertMany(userBlog);
    const groupBlog = await blogGroupRel(req.body.groups, blog._id);
    await GroupBlog.insertMany(groupBlog);
  }
  return res.status(c.SERVER_OK_HTTP_CODE).send(blog);
});

//GET ALL BLOGS
router.get("/all/:page", async (req, res) => {
  const { page } = req.params;
  let { search } = req.query;
  if (search === "undefined" || search === undefined) {
    search = "";
  }
  const currentPage = parseInt(page) || 1;
  const offset = ITEMS_PER_PAGE * (currentPage - 1);
  const token = getToken(req, res);
  if (!token || token === undefined) {
    const data = await getPublicBlogs(search, offset, ITEMS_PER_PAGE);
    if (isValid(data))
      return res.status(c.SERVER_NOT_FOUND_HTTP_CODE).json("Blogs Not Found");
    return res.status(c.SERVER_OK_HTTP_CODE).send(data);
  } else {
    const blogs = await getAllBlogs(search, offset, req.user.userName);
    if (isValid(blogs))
      return res.status(c.SERVER_NOT_FOUND_HTTP_CODE).json("Blogs not found");
    return res.status(c.SERVER_OK_HTTP_CODE).send(blogs);
  }
});

//GET ALL BLOGS OF A GIVEN USER
router.get("/:page/:userName", [auth], async (req, res) => {
  const { page, userName } = req.params;
  let { search } = req.query;
  if (search === "undefined") {
    search = "";
  }
  const currentPage = parseInt(page) || 1;
  const offset = ITEMS_PER_PAGE * (currentPage - 1);
  const blogs = await getUsersBlogs(
    search,
    offset,
    userName,
    req.user.userName
  );

  if (isValid(blogs))
    return res.status(c.SERVER_NOT_FOUND_HTTP_CODE).json("Blogs not found");
  return res.status(c.SERVER_OK_HTTP_CODE).send(blogs);
});

//GET MY BLOGS
router.get("/:page", [auth], async (req, res) => {
  let search = req.query.search;
  if (search === "undefined") {
    search = "";
  }
  const currentPage = parseInt(req.params.page) || 1;
  const offset = ITEMS_PER_PAGE * (currentPage - 1);
  const blogs = await getOwnersBlogs(search, offset, req.user.userName);
  if (isValid(blogs))
    return res.status(c.SERVER_NOT_FOUND_HTTP_CODE).json("Blogs not found");
  return res.status(c.SERVER_OK_HTTP_CODE).send(blogs);
});

//DELETE BLOG
router.delete("/remove/:blogId", [auth], async (req, res) => {
  const { blogId } = req.params;
  const blog = await Blog.findById(blogId);
  if (!blog)
    return res.status(c.SERVER_NOT_FOUND_HTTP_CODE).json("Blog Not Found");
  if (blog.owner.toString() !== req.user.userName)
    return res.status(c.NOT_AUTHORIZED_HTTP_CODE).json(c.INVALID_TOKEN_ERROR);
  await UserBlog.deleteMany({ blogId });
  await GroupBlog.deleteMany({ blogId });
  await Blog.findByIdAndDelete(blogId);
  return res.status(c.SERVER_OK_HTTP_CODE).json("Post Deleted Successfully");
});
//EDIT BLOG
router.put("/edit", [auth], async (req, res) => {
  const { id } = req.body;
  const blog = await Blog.findById(id);
  if (!blog) res.status(c.SERVER_NOT_FOUND_HTTP_CODE).json("Blog Not Found");
  if (blog.owner !== req.user.userName) {
    return res.status(c.NOT_AUTHORIZED_HTTP_CODE).json(c.INVALID_TOKEN_ERROR);
  }
  await UserBlog.deleteMany({ blogId: id });
  await GroupBlog.deleteMany({ blogId: id });

  const newBlog = {
    title: req.body.title,
    description: req.body.description,
    permission: req.body.permission
  };
  if (req.body.permission === "private") {
    const userBlog = await relCreation(
      req.body.owner,
      req.body.members,
      "userName",
      "blogId",
      id
    );
    await UserBlog.insertMany(userBlog);
    const groupBlog = await blogGroupRel(req.body.groups, id);
    await GroupBlog.insertMany(groupBlog);
  }
  await Blog.updateOne({ _id: id }, { $set: newBlog });
  return res.status(c.SERVER_OK_HTTP_CODE).json("Blog updated successfully");
});

module.exports = router;
