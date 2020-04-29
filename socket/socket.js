const socketServices = require("../services/socket");
const CONSTANTS = require("../common/constants");

module.exports = function (io) {
  io.use(async (socket, next) => {
    let res = await socketServices.addSocketId({
      userId: socket.request._query["userId"],
      socketId: socket.id,
    });
    if (res) {
      next();
    }
  });

  socketEvents(io);
};

function socketEvents(io) {
  io.on("connection", (socket) => {
    /**
     * send the messages to the user
     */
    socket.on(`add-message`, async (data) => {
      if (!data.message) {
        io.to(socket.id).emit(`add-message-response`, {
          error: true,
          message: CONSTANTS.MESSAGE_NOT_FOUND,
        });
      } else if (!data.userName) {
        io.to(socket.id).emit(`add-message-response`, {
          error: true,
          message: CONSTANTS.SERVER_ERROR_MESSAGE,
        });
      } else if (!data.reciever) {
        io.to(socket.id).emit(`add-message-response`, {
          error: true,
          message: CONSTANTS.SELECT_USER,
        });
      } else {
        const toSocketId = await socketServices.getSocketId(data.reciever);
        const messageResult = await socketServices.insertMessages(data);
        if (!messageResult) {
          io.to(socket.id).emit(`add-message-response`, {
            error: true,
            message: CONSTANTS.MESSAGE_STORE_ERROR,
          });
          return;
        }
        io.to(socket.id).emit(`add-message-response`, messageResult);
        io.to(toSocketId).emit(`add-message-response`, messageResult);
      }
    });

    /**
     * Logout the user
     */
    socket.on("logout", async (userName) => {
      let res = await socketServices.logout(userName);
      if (!res) {
        io.to(socket.id).emit(`logout-response`, {
          error: true,
          message: CONSTANTS.SERVER_ERROR_MESSAGE,
          userName: userName,
        });
        return;
      }

      io.to(socket.id).emit(`logout-response`, {
        error: false,
        message: CONSTANTS.USER_LOGGED_OUT,
        userName: userName,
      });
      socket.broadcast.emit(`chat-list-user-logout`, {
        error: false,
        userName: userName,
      });
    });

    /**login user */
    socket.on("login", async (userName) => {
      io.to(socket.id).emit(`login-response`, {
        error: false,
        message: CONSTANTS.USER_LOGGED_OUT,
        userName: userName,
      });
      socket.broadcast.emit(`user-login-response`, {
        error: false,
        userName: userName,
      });
    });

    /**block user */
    socket.on("toggleBlock", async (data) => {
      const toSocketId = await socketServices.getSocketId(data.blocked);
      const block = await socketServices.toggleBlockUser(data);
      io.to(toSocketId).emit(`user-block-response`, {
        error: false,
        blocker: data.blocker,
        isBlocked: data.isBlocked,
      });
    });
  });
}
