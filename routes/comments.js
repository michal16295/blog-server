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
      content: comment
    });
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

module.exports = router;
