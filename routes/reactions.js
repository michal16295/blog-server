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
const { searchQuery, getAll, isValid } = require("../services/aggregate");
const ITEMS_PER_PAGE = 10;
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
  const count = await Reaction.find({ blogId }).countDocuments();
  const data = { count, type: reaction.type };
  return res.status(c.SERVER_OK_HTTP_CODE).send(data);
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
    const count = await Reaction.find({ blogId }).countDocuments();
    return res.sendStatus(c.SERVER_OK_HTTP_CODE).send(count);
  } catch (err) {
    return res.status(c.SERVER_ERROR_HTTP_CODE).send(err.message);
  }
});
//GET ALL REACTIONS
router.get("/getAll/:page/:blogId", async (req, res) => {
  const { type } = req.query;
  if (type === "undefined") {
    type = "";
  }
  const currentPage = parseInt(req.params.page) || 1;
  const offset = ITEMS_PER_PAGE * (currentPage - 1);
  let obj = {
    metadata: [
      { $count: "total" },
      { $addFields: { ITEMS_PER_PAGE: ITEMS_PER_PAGE } }
    ],
    data: [{ $skip: offset }, { $limit: ITEMS_PER_PAGE }]
  };
  const data = await Reaction.aggregate([
    {
      $match: {
        type: { $regex: type, $options: "i" },
        blogId: mongoose.Types.ObjectId(req.params.blogId)
      }
    },
    {
      $facet: obj
    }
  ]);
  if (isValid(data))
    return res.status(c.SERVER_NOT_FOUND_HTTP_CODE).json("No Reactions");
  return res.status(c.SERVER_OK_HTTP_CODE).send(data);
});
module.exports = router;
