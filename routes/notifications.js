const express = require("express");
const router = express.Router();
const c = require("../common/constants");
const { Notification } = require("../models/notification");
const auth = require("../middlewares/auth");
const ITEMS_PER_PAGE = 10;

//GET NOTIFICATIONS
router.get("/:page", [auth], async (req, res) => {
  const { page } = req.params;
  const { userName } = req.user;
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
    let data = await Notification.aggregate([
      {
        $match: {
          to: userName
        }
      },
      {
        $sort: { date: -1 }
      },
      {
        $facet: obj
      }
    ]);
    const notViewed = await Notification.find({
      to: userName,
      isViewed: false
    }).countDocuments();
    const response = {
      data,
      notViewed
    };
    return res.status(c.SERVER_OK_HTTP_CODE).send(response);
  } catch (err) {
    return res.status(c.SERVER_ERROR_HTTP_CODE).json(err.message);
  }
});
//CHANGE VIEWED
router.put("/viewed", [auth], async (req, res) => {
  const { userName } = req.user;
  const newNotify = {
    isViewed: true
  };
  try {
    await Notification.updateMany({ to: userName }, { $set: newNotify });
    return res.status(c.SERVER_OK_HTTP_CODE).send("Notification updated");
  } catch (err) {
    return res.status(c.SERVER_ERROR_HTTP_CODE).send(err.message);
  }
});
module.exports = router;
