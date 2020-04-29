const { Message } = require("../models/message");
const { Chat } = require("../models/chat");
const { User } = require("../models/user");
const mongoose = require("mongoose");

module.exports.addSocketId = async ({ userId, socketId }) => {
  let res = null;
  try {
    res = await User.updateOne(
      { _id: userId },
      { $set: { socketId, online: "Y" } }
    );
  } catch (error) {
    console.error(error);
  }
  return res;
};

module.exports.getSocketId = async (userName) => {
  let res = null;
  try {
    res = await User.findOne({ userName }).select("socketId");
    if (!res) {
      console.error("User not found");
      return null;
    }
    res = res.socketId;
  } catch (error) {
    console.error(error);
  }
  return res;
};
module.exports.insertMessages = async (data) => {
  const { reciever, message, userName } = data;
  let res = {};
  if (reciever === userName) return (res.error = "Cant Message Yourself");
  try {
    const cond = {
      $or: [
        { user1: reciever, user2: userName },
        { user1: userName, user2: reciever },
      ],
    };
    const chat = await Chat.findOne(cond);
    if (chat !== null && chat.isBlocked)
      return (res.error = "Cant send a message to blocked user");
    const msg = new Message({
      to: reciever,
      message,
      from: userName,
    });
    await msg.save();
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
    return msg;
  } catch (err) {
    console.log(err.message);
    return (res.error = err.message);
  }
};

module.exports.logout = async (userName) => {
  let res = null;
  try {
    res = await User.updateOne({ userName }, { $set: { online: "N" } });
  } catch (error) {
    console.error(error);
  }
  return res;
};
module.exports.blockUser = async (data) => {
  let res = {};
  const { blocker, blocked } = data;
  const cond = {
    $or: [
      { user1: blocker, user2: blocked },
      { user1: blocked, user2: blocker },
    ],
  };
  try {
    await Chat.updateOne(cond, { $set: { isBlocked: true, blocker } });
    return (res.success = "User Is Blocked");
  } catch (err) {
    return (res.error = err.message);
  }
};
