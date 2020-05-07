const express = require("express");
const router = express.Router();
const auth = require("../middlewares/auth");
var cloudinary = require("cloudinary").v2;
cloudinary.config({
  cloud_name: "photocloudmichal",
  api_key: "352763943198558",
  api_secret: "ty5KA-fgxaHjrI22NxwDFqY6ARI",
});

//UPLOAD PHOTO
router.post("/upload", [auth], async (req, res) => {
  cloudinary.uploader
    .upload_stream(async (error, result) => {
      try {
        await User.updateOne(
          { _id: req.user._id },
          { $set: { avatar: result.secure_url } }
        );
      } catch (err) {
        return res.status(c.SERVER_ERROR_HTTP_CODE).send(err.message);
      }
    })
    .end(req.files.file.data);
});
module.exports = router;
