const express = require("express");
const router = express.Router();
const c = require("../common/constants");
const { Notification } = require("../models/notification");
const { Settings } = require("../models/settings");
const auth = require("../middlewares/auth");
const ITEMS_PER_PAGE = 10;

//GET SETTINGS
router.get("/getWebSettings", [auth], async (req, res) => {
  const user = req.user.userName;
  try {
    let settings = await Settings.findOne({ user });
    if (!settings) {
      let options = ["groups", "blogs", "reactions", "comments"];
      settings = new Settings({
        web: options,
        email: options,
      });
      await settings.save();
    }
    let web = {};
    for (var i = 0; i < settings.web.length; i++) {
      web[settings.web[i]] = true;
    }
    let email = {};
    for (var i = 0; i < settings.email.length; i++) {
      email[settings.email[i]] = true;
    }
    const response = { web, email };
    return res.status(c.SERVER_OK_HTTP_CODE).send(response);
  } catch (err) {
    return res.status(c.SERVER_ERROR_HTTP_CODE).send(err.message);
  }
});

//CHANGE VIEWED
router.put("/viewed/:id", [auth], async (req, res) => {
  const { userName } = req.user;
  const { id } = req.params;
  const newNotify = {
    isViewed: true,
  };
  try {
    await Notification.updateOne(
      { _id: id, to: userName },
      { $set: newNotify }
    );
    const notViewed = await Notification.find({
      to: userName,
      isViewed: false,
    }).countDocuments();
    const data = { notViewed };
    return res.status(c.SERVER_OK_HTTP_CODE).send(data);
  } catch (err) {
    return res.status(c.SERVER_ERROR_HTTP_CODE).send(err.message);
  }
});
//SETTINGS
router.post("/settings", [auth], async (req, res) => {
  let data = req.body;
  const user = req.user.userName;
  let arr = ["groups", "blogs", "comments", "reactions"];
  let webOptions = [];
  let emailOptions = [];
  for (var i = 0; i < arr.length; i++) {
    if (data.web[arr[i]]) webOptions.push(arr[i]);
    if (data.email[arr[i]]) emailOptions.push(arr[i]);
  }
  try {
    let settings = await Settings.findOne({ user });
    if (!settings) {
      settings = new Settings({
        web: webOptions,
        email: emailOptions,
      });
      await settings.save();
    } else {
      await Settings.updateOne(
        { user },
        { $set: { web: webOptions, email: emailOptions } }
      );
    }
    return res.status(c.SERVER_OK_HTTP_CODE).send(settings);
  } catch (err) {
    return res.status(c.SERVER_ERROR_HTTP_CODE).send(err.message);
  }
});

//GET NOTIFICATIONS
router.get("/:page", [auth], async (req, res) => {
  const { page } = req.params;
  const { userName } = req.user;
  const currentPage = parseInt(page) || 1;
  const offset = ITEMS_PER_PAGE * (currentPage - 1);
  let obj = {
    metadata: [
      { $count: "total" },
      { $addFields: { ITEMS_PER_PAGE: ITEMS_PER_PAGE } },
    ],
    data: [{ $skip: offset }, { $limit: ITEMS_PER_PAGE }],
  };
  try {
    let data = await Notification.aggregate([
      {
        $match: {
          to: userName,
        },
      },
      {
        $sort: { date: -1 },
      },
      {
        $facet: obj,
      },
    ]);
    const notViewed = await Notification.find({
      to: userName,
      isViewed: false,
    }).countDocuments();
    const response = {
      data,
      notViewed,
    };
    return res.status(c.SERVER_OK_HTTP_CODE).send(response);
  } catch (err) {
    return res.status(c.SERVER_ERROR_HTTP_CODE).json(err.message);
  }
});
module.exports = router;
