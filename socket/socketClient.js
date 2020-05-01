const events = require("events");
const socketServices = require("../services/socket");
eventEmitter = new events.EventEmitter();

let client = null;
module.exports.send = async (topic, data) => {
  const toSocketId = await socketServices.getSocketId(data.to);
  client.to(toSocketId).emit(topic, data);
};

module.exports.setIo = (io) => {
  client = io;
};
