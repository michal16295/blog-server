const express = require("express");
const cors = require("cors");
const app = express();
var corOp = {
  credentials: true,
  origin: "http://localhost:3000",
  optionsSuccessStatus: 200
};
app.use(cors(corOp));
const connectDB = require("./config/db");
require("./models/user");
require("./services/passport");
connectDB();
require("./middlewares/cookieSession")(app);
require("./startup/routes")(app);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
