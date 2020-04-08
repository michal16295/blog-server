const express = require("express");
const router = express.Router();
const c = require("../common/constants");
const { Blog } = require("../models/blogs");
const { Reaction } = require("../models/reaction");
const { User } = require("../models/user");
const auth = require("../middlewares/auth");
const mongoose = require("mongoose");
const { getToken } = require("../middlewares/getToken");
const { isAuthotrized } = require("../services/blogs");

//SET NEW REACTION
router.post("/setReaction", [auth], async (req, res) => {
  const { blogId, name, userName } = req.body;
  var reaction = await Reaction.findOne({ blogId, userName });
  if (reaction) {
    const newReaction = {
      type: name
    };
    await Reaction.updateOne({ _id: reaction._id }, { $set: newReaction });
  } else {
    reaction = new Reaction({
      blogId,
      userName,
      type: name
    });
    await reaction.save();
  }
  return res.status(c.SERVER_OK_HTTP_CODE).send(reaction.type);
});
//GET CURRENT USER REACTION
router.get("/currentUserReaction/:blogId", [auth], async (req, res) => {
  const { blogId } = req.params;
  const reaction = await Reaction.findOne({
    blogId,
    userName: req.user.userName
  });
  if (!reaction)
    return res.status(c.SERVER_NOT_FOUND_HTTP_CODE).json("No Reaction");
  return res.status(c.SERVER_OK_HTTP_CODE).send(reaction.type);
});
//DELETE REACTION
router.delete("/remove/:blogId/:userName", [auth], async (req, res) => {
  const { blogId, userName } = req.params;
  try {
    await Reaction.findOneAndDelete({ blogId, userName });
    return res
      .status(c.SERVER_OK_HTTP_CODE)
      .json("reaction deleted successfully");
  } catch (err) {
    return res.status(c.SERVER_ERROR_HTTP_CODE).send(err.message);
  }
});
//REACTIONS COUNT
router.get("/count/:blogId", async (req, res) => {});
module.exports = router;
