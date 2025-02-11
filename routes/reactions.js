const express = require("express");
const router = express.Router();
const c = require("../common/constants");
const { Reaction } = require("../models/reaction");
const auth = require("../middlewares/auth");
const mongoose = require("mongoose");
const { isValid } = require("../services/aggregate");
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
      type: name,
      ownerAvatar: req.user.avatar
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
    const data = {
      count
    };
    return res.status(c.SERVER_OK_HTTP_CODE).send(data);
  } catch (err) {
    return res.status(c.SERVER_ERROR_HTTP_CODE).send(err.message);
  }
});
//GET ALL REACTIONS
router.get("/getAll/:page/:blogId", async (req, res) => {
  const { type } = req.query;
  const { blogId, page } = req.params;
  if (type === "undefined") {
    type = "";
  }
  const currentPage = parseInt(page) || 1;
  const offset = ITEMS_PER_PAGE * (currentPage - 1);
  let obj = {
    metadata: [
      { $count: "total" },
      { $addFields: { ITEMS_PER_PAGE: ITEMS_PER_PAGE } }
    ],
    data: [{ $skip: offset }, { $limit: ITEMS_PER_PAGE }]
  };
  let data = await Reaction.aggregate([
    {
      $match: {
        type: { $regex: type, $options: "i" },
        blogId: mongoose.Types.ObjectId(blogId)
      }
    },
    {
      $facet: obj
    }
  ]);
  const allCount = await Reaction.find({ blogId }).countDocuments();
  const response = {
    allCount,
    data
  };
  if (isValid(data))
    return res.status(c.SERVER_NOT_FOUND_HTTP_CODE).json("No Reactions");
  return res.status(c.SERVER_OK_HTTP_CODE).send(response);
});
module.exports = router;
