const express = require("express");
const router = express.Router();
const c = require("../common/constants");
const { Message } = require("../models/message");
const { Chat } = require("../models/chat");
const { User } = require("../models/user");
const auth = require("../middlewares/auth");
const ITEMS_PER_PAGE = 30;

//GET MESSAGES
router.get("/getMessages/:reciever/:page", [auth], async (req, res) => {
  const { reciever, page } = req.params;
  const { userName } = req.user;
  const currentPage = parseInt(page) || 1;
  const offset = ITEMS_PER_PAGE * (currentPage - 1);

  try {
    await Message.updateMany(
      { from: reciever, to: userName },
      { $set: { isViewed: true } }
    );
  } catch (err) {
    console.log(err);
  }

  let obj = {
    metadata: [
      { $count: "total" },
      { $addFields: { ITEMS_PER_PAGE: ITEMS_PER_PAGE } },
    ],
    data: [{ $skip: offset }, { $limit: ITEMS_PER_PAGE }],
  };
  try {
    let data = await Message.aggregate([
      {
        $match: {
          $or: [
            {
              to: reciever,
              from: userName,
            },
            {
              to: userName,
              from: reciever,
            },
          ],
        },
      },
      {
        $sort: { date: -1 },
      },
      {
        $facet: obj,
      },
    ]);
    data[0].data = data[0].data.reverse();
    return res.status(c.SERVER_OK_HTTP_CODE).send(data);
  } catch (err) {
    return res.status(c.SERVER_ERROR_HTTP_CODE).json(err.message);
  }
});
// RECENT CONVERSATIONS
router.get("/recent", [auth], async (req, res) => {
  const { userName } = req.user;
  const currentPage = 1;
  const offset = ITEMS_PER_PAGE * (currentPage - 1);
  let obj = {
    metadata: [
      { $count: "total" },
      { $addFields: { ITEMS_PER_PAGE: ITEMS_PER_PAGE } },
    ],
    data: [{ $skip: offset }, { $limit: ITEMS_PER_PAGE }],
  };
  try {
    let data = await Chat.aggregate([
      {
        $match: {
          $or: [
            {
              user1: userName,
            },
            {
              user2: userName,
            },
          ],
        },
      },
      {
        $sort: { date: -1 },
      },
      {
        $facet: obj,
      },
    ]);
    return res.status(c.SERVER_OK_HTTP_CODE).send(data);
  } catch (err) {
    console.log(err);
    return res.status(c.SERVER_ERROR_HTTP_CODE).json(err.message);
  }
});
//AMOUNT OF NOT VIEWD CHATS
router.get("/unreadMsg", [auth], async (req, res) => {
  const { userName } = req.user;
  try {
    let unreadMsg = await Message.find({ to: userName, isViewed: false });
    unreadMsg = unreadMsg.map((user) => user.from);
    unreadMsg = Array.from(new Set(unreadMsg));
    const amount = {
      count: unreadMsg.length,
    };
    return res.status(c.SERVER_OK_HTTP_CODE).send(amount);
  } catch (err) {
    return res.status(c.SERVER_ERROR_HTTP_CODE).send(err.message);
  }
});

//NOT VIEWED MESSAGES PER PERSON
router.get("/unreadMsgs/:reciever", [auth], async (req, res) => {
  const { reciever } = req.params;
  const { userName } = req.user;

  try {
    const messages = await Message.find({
      from: reciever,
      to: userName,
      isViewed: false,
    });
    const data = {
      notViewed: messages.length,
    };
    return res.status(c.SERVER_OK_HTTP_CODE).send(data);
  } catch (err) {
    return res.status(c.SERVER_ERROR_HTTP_CODE).send(err.message);
  }
});

//UBBLOCK USER
router.put("/unblock/:userName", [auth], async (req, res) => {
  const blocker = req.user.userName;
  const blocked = req.params.userName;
  const cond = {
    $or: [
      { user1: blocker, user2: blocked },
      { user1: blocked, user2: blocker },
    ],
  };
  try {
    await Chat.updateOne(cond, { $set: { isBlocked: false } });
    return res.status(c.SERVER_OK_HTTP_CODE).send({ user: blocked });
  } catch (err) {
    console.log(err);
    return res.status(c.SERVER_ERROR_HTTP_CODE).send(err.message);
  }
});
//LIST OF BLOCKED USERS
router.get("/blockedList", [auth], async (req, res) => {
  const { userName } = req.user;
  try {
    const blockedUsers = await Chat.find({
      blocker: userName,
      isBlocked: true,
    });
    if (!blockedUsers)
      return res
        .status(c.SERVER_NOT_FOUND_HTTP_CODE)
        .send("You Did Not Block Anyone");
    let response = [];
    for (var i = 0; i < blockedUsers.length; i++) {
      if (blockedUsers[i].user1 === userName)
        response.push(blockedUsers[i].user2);
      else response.push(blockedUsers[i].user1);
    }
    const users = await User.find({ userName: { $in: response } });
    return res.status(c.SERVER_OK_HTTP_CODE).send(users);
  } catch (err) {
    return res.status(c.SERVER_ERROR_HTTP_CODE).send(err.message);
  }
});
module.exports = router;
