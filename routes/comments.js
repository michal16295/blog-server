const express = require("express");
const router = express.Router();
const c = require("../common/constants");
const { Comment } = require("../models/comments");
const auth = require("../middlewares/auth");
const mongoose = require("mongoose");
const ITEMS_PER_PAGE = 10;

//CREATE COMMENT
router.post("/create", [auth], async (req, res) => {
  const { blogId, comment } = req.body;
  try {
    let newComment = new Comment({
      userName: req.user.userName,
      blogId,
      content: comment,
      ownerAvatar: req.user.avatar
    });
    console.log(req.user);
    await newComment.save();
    const count = await Comment.find({ blogId }).countDocuments();
    const data = {
      count,
      newComment
    };
    return res.status(c.SERVER_OK_HTTP_CODE).send(data);
  } catch (err) {
    return res.status(c.SERVER_ERROR_HTTP_CODE).json(err.message);
  }
});

//GET ALL COMMENTS
router.get("/getAll/:page/:blogId", async (req, res) => {
  const { blogId, page } = req.params;
  const currentPage = parseInt(page) || 1;
  const offset = ITEMS_PER_PAGE * (currentPage - 1);
  let obj = {
    metadata: [
      { $count: "total" },
      { $addFields: { ITEMS_PER_PAGE: ITEMS_PER_PAGE } }
    ],
    data: [{ $skip: offset }, { $limit: ITEMS_PER_PAGE }]
  };
  try {
    let data = await Comment.aggregate([
      {
        $match: {
          blogId: mongoose.Types.ObjectId(blogId)
        }
      },
      {
        $sort: { date: -1 }
      },
      {
        $facet: obj
      }
    ]);
    return res.status(c.SERVER_OK_HTTP_CODE).send(data);
  } catch (err) {
    return res.status(c.SERVER_ERROR_HTTP_CODE).json(err.message);
  }
});
//EDIT COMMETN
router.put("/edit", [auth], async (req, res) => {
  const { content, commentId } = req.body;
  const comment = await Comment.findById(commentId);
  if (!comment)
    return res.status(c.SERVER_NOT_FOUND_HTTP_CODE).json("Comment not found");
  let newComment = {
    update: Date.now(),
    content
  };
  try {
    await Comment.updateOne({ _id: commentId }, { $set: newComment });
    return res.status(c.SERVER_OK_HTTP_CODE).send("Comment Edit");
  } catch (err) {
    return res.status(c.SERVER_ERROR_HTTP_CODE).json(err.message);
  }
});
//DELETE COMMENT
router.delete("/delete/:id", [auth], async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment)
      return res.status(c.SERVER_NOT_FOUND_HTTP_CODE).send("Comment not found");
    if (comment.userName !== req.user.userName)
      return res.status(c.NOT_AUTHORIZED_HTTP_CODE).send(c.INVALID_TOKEN_ERROR);
    await Comment.findByIdAndDelete(req.params.id);
    const count = await Comment.find({
      blogId: comment.blogId
    }).countDocuments();
    const data = {
      count: count,
      comment
    };
    return res.status(c.SERVER_OK_HTTP_CODE).send(data);
  } catch (err) {
    return res.status(c.SERVER_ERROR_HTTP_CODE).send(err.message);
  }
});
module.exports = router;
