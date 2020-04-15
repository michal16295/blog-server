const express = require("express");
const router = express.Router();
const c = require("../common/constants");
const { Message } = require("../models/message");
const { Chat } = require("../models/chat");
const { User } = require("../models/user");
const auth = require("../middlewares/auth");
const ITEMS_PER_PAGE = 30;

//SEND MESSAGE
router.post("/send", [auth], async (req, res) => {
  const { reciever, message } = req.body;
  const { userName } = req.user;
  if (reciever === userName)
    return res.status(c.SERVER_ERROR_HTTP_CODE).send("Cant Message Yourself");
  try {
    const msg = new Message({
      to: reciever,
      message,
      from: userName,
    });
    await msg.save();
    const cond = {
      $or: [
        { user1: reciever, user2: userName },
        { user1: userName, user2: reciever },
      ],
    };
    const chat = await Chat.findOne(cond);
    if (!chat) {
      let newChat = new Chat({
        user1: reciever,
        user2: userName,
        message,
      });
      await newChat.save();
    } else {
      const updatedChat = {
        date: msg.date,
        message,
      };
      await Chat.updateOne(cond, { $set: updatedChat });
    }
    return res.status(c.SERVER_OK_HTTP_CODE).send(msg);
  } catch (err) {
    return res.status(c.SERVER_ERROR_HTTP_CODE).send(err.message);
  }
});
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
        $sort: { date: 1 },
      },
      {
        $facet: obj,
      },
    ]);
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
module.exports = router;
