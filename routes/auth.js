const passport = require("passport");
const express = require("express");
const router = express.Router();
const c = require("../common/constants");
const valid = require("../validators/user");
const { User } = require("../models/user");
const { UserBlog } = require("../models/userBlog");
const { UserGroup } = require("../models/userGroup");
const { Reaction } = require("../models/reaction");
const { Comment } = require("../models/comments");
const { Group } = require("../models/groups");
const { Blog } = require("../models/blogs");
const { GroupBlog } = require("../models/groupBlog");
const bcrypt = require("bcrypt");
const jwtDecode = require("jwt-decode");
const auth = require("../middlewares/auth");
const { getAll, isValid } = require("../services/aggregate");
const { generateRandomAvatar } = require("../avatar/generateAvatar");
const { updateAvatar } = require("../services/common");

const ITEMS_PER_PAGE = 4;

router.get(
  "/auth/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
  })
);
router.get(
  "/auth/google/callback",
  passport.authenticate("google"),
  (req, res) => {
    res.redirect("http://localhost:3000/");
  }
);
router.get("/auth/google/callback", passport.authenticate("google"));

router.get("/api/currentUser", (req, res) => {
  res.send(req.user);
});

router.get("/api/logout", (req, res) => {
  req.logout();
  res.send(req.user);
});

//Manual Registretion
router.post("/register", async (req, res) => {
  let { errors } = valid.validateNewUser(req.body);
  if (errors) {
    return res.status(c.SERVER_BAD_REQUEST_HTTP_CODE).json(errors);
  }
  let email = await User.findOne({ email: req.body.email });
  let userName = await User.findOne({ userName: req.body.userName });
  if (email || userName) {
    errors = c.USER_ALREADY_EXISTS;
    return res.status(c.SERVER_BAD_REQUEST_HTTP_CODE).json(errors);
  }
  const salt = await bcrypt.genSalt(10);
  const newPassword = await bcrypt.hash(req.body.password, salt);
  const avatar = generateRandomAvatar("Circle");
  user = new User({
    firstName: req.body.firstName,
    lastName: req.body.lastName,
    email: req.body.email,
    password: newPassword,
    userName: req.body.userName,
    avatar,
  });
  await user.save();
  const token = user.generateAuthToken();
  res
    .header("x-auth-token", token)
    .header("access-control-expose-headers", "x-auth-token")
    .send(user);
});
//DELETE USER
router.post("/deleteAccount", [auth], async (req, res) => {
  const { password } = req.body;
  const { _id, userName } = req.user;
  if (req.body.userName !== userName)
    return res.status(c.SERVER_ERROR_HTTP_CODE).json(c.USER_LOGIN_FAILED);
  const user = await User.findOne({ userName });
  const validPassword = await bcrypt.compare(password, user.password);
  if (!validPassword)
    return res.status(c.SERVER_ERROR_HTTP_CODE).json(c.USER_LOGIN_FAILED);
  try {
    await UserGroup.deleteMany({ userName });
    await UserBlog.deleteMany({ userName });
    await Reaction.deleteMany({ userName });
    await Comment.deleteMany({ userName });
    let blogs = await Blog.find({ owner: userName });
    blogs = blogs.map((i) => i._id);
    await UserBlog.deleteMany({ blogId: { $in: blogs } });
    await Reaction.deleteMany({ blogId: { $in: blogs } });
    await Comment.deleteMany({ blogId: { $in: blogs } });
    let groups = await GroupBlog.find({ blogId: { $in: blogs } });
    groups = groups.map((i) => groupId);
    await UserGroup.deleteMany({ groupId: { $in: groups } });
    await GroupBlog.deleteMany({ groupId: { $in: groups } });
    await Blog.deleteMany({ owner: userName });
    let groups2 = await Group.find({ owner: userName });
    groups2 = groups2.map((i) => i._id);
    await UserGroup.deleteMany({ groupId: { $in: groups2 } });
    await Group.deleteMany({ owner: userName });
    await User.deleteOne({ _id });
    return res.status(c.SERVER_OK_HTTP_CODE).send("User deleted");
  } catch (err) {
    return res.status(c.SERVER_ERROR_HTTP_CODE).send(err.message);
  }
});
//Login
router.post("/login", async (req, res) => {
  let { error } = valid.validateExistingUser(req.body);
  if (error) {
    return res.status(c.SERVER_BAD_REQUEST_HTTP_CODE).json(error);
  }
  const lowerCaseEmail = req.body.email.toLowerCase();
  let user = await User.findOne({ email: lowerCaseEmail });
  if (!user)
    return res.status(c.SERVER_NOT_FOUND_HTTP_CODE).json(c.USER_NOT_FOUND);
  const validPassword = await bcrypt.compare(req.body.password, user.password);
  if (!validPassword)
    return res.status(c.SERVER_ERROR_HTTP_CODE).json(c.USER_LOGIN_FAILED);
  const token = user.generateAuthToken();
  res
    .header("x-auth-token", token)
    .header("access-control-expose-headers", "x-auth-token")
    .json(token);
});

//Get Current User
router.get("/me", async (req, res) => {
  const token = req.headers["x-auth-token"];
  if (!token)
    return res
      .status(c.SERVER_NOT_FOUND_HTTP_CODE)
      .json(c.TOKEN_NOT_PROVIDED_ERROR);
  const tokenDecoded = jwtDecode(token);
  const user = await User.findById(tokenDecoded._id).select("-password");
  if (!user)
    return res.status(c.SERVER_NOT_FOUND_HTTP_CODE).json(c.USER_NOT_FOUND);
  return res.status(c.SERVER_OK_HTTP_CODE).send(user);
});

//Get User by username
router.get("/:userName", async (req, res) => {
  const user = await User.findOne({ userName: req.params.userName }).select(
    "-password"
  );
  if (!user)
    return res.status(c.SERVER_NOT_FOUND_HTTP_CODE).json(c.USER_NOT_FOUND);
  return res.status(c.SERVER_OK_HTTP_CODE).send(user);
});

//Get All Users
router.get("/all/:page", async (req, res) => {
  let search = req.query.search;
  if (search === "undefined") {
    search = "";
  }
  const cusrrentPage = parseInt(req.params.page) || 1;
  const offset = ITEMS_PER_PAGE * (cusrrentPage - 1);
  const users = await getAll(User, search, offset, ITEMS_PER_PAGE, "userName");
  if (isValid(users))
    return res.status(c.SERVER_NOT_FOUND_HTTP_CODE).json(c.USER_NOT_FOUND);
  return res.status(c.SERVER_OK_HTTP_CODE).send(users);
});

//EDIT PROFILE
router.put("/edit/:id", async (req, res) => {
  const { firstName, lastName, email, avatar } = req.body;
  const user = await User.findById(req.params.id);
  if (!user)
    return res.status(c.SERVER_NOT_FOUND_HTTP_CODE).json(c.USER_NOT_FOUND);

  const emailTaken = await User.findOne({ email });
  if (emailTaken._id.toString() !== req.params.id.toString()) {
    return res.status(c.SERVER_NOT_ALLOWED_HTTP_CODE).json(c.EMAIL_IS_TAKEN);
  }
  if (user.avatar !== avatar) {
    updateAvatar(Group, user.userName, avatar);
    updateAvatar(Blog, user.userName, avatar);
  }
  let updatedUser = {
    firstName,
    lastName,
    email,
    avatar,
  };
  await User.updateOne({ _id: req.params.id }, { $set: updatedUser });
  return res.status(c.SERVER_OK_HTTP_CODE).send(user);
});

//CHANGE PASSWORD
router.put("/changePass/:id", async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user)
    return res.status(c.SERVER_NOT_FOUND_HTTP_CODE).json(c.USER_NOT_FOUND);
  const validPassword = await bcrypt.compare(req.body.oldPass, user.password);
  if (!validPassword)
    return res.status(c.SERVER_ERROR_HTTP_CODE).json("Wrong Password");

  const salt = await bcrypt.genSalt(10);
  let np = {};
  np.password = await bcrypt.hash(req.body.newPass, salt);
  await User.updateOne({ _id: req.params.id }, { $set: np });
  return res.status(c.SERVER_OK_HTTP_CODE).send(user);
});
//RANDOM AVATAR
router.get("/avatar/random", async (req, res) => {
  const newAvatar = generateRandomAvatar("Circle");
  return res.status(c.SERVER_OK_HTTP_CODE).send(newAvatar);
});

//GET AVATAR
router.get("/getAvatar/:userName", async (req, res) => {
  const { userName } = req.params;
  try {
    const user = await User.findOne({ userName });
    if (!user)
      return res.status(c.SERVER_NOT_FOUND_HTTP_CODE).send(c.USER_NOT_FOUND);
    const data = {
      avatar: user.avatar,
    };
    return res.status(c.SERVER_OK_HTTP_CODE).send(data);
  } catch (err) {
    console.log(err.message);
    return res.status(c.SERVER_ERROR_HTTP_CODE).send(err.message);
  }
});

module.exports = router;
