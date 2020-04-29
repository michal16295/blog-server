const express = require("express");
const cors = require("cors");
const app = express();
const http = require("http");
const socketio = require("socket.io");
var corOp = {
  credentials: true,
  origin: "http://localhost:3000",
  optionsSuccessStatus: 200,
};
app.use(cors(corOp));
const connectDB = require("./config/db");
require("./models/user");
require("./services/passport");
connectDB();
require("./middlewares/cookieSession")(app);
require("./startup/routes")(app);

const httpServer = http.Server(app);
const socket = socketio(httpServer);
require("./socket/socket")(socket);

const PORT = process.env.PORT || 5000;

httpServer.listen(PORT, () => console.log(`Server started on port ${PORT}`));

module.exports = httpServer;
