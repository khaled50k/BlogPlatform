//this is user route
const express = require("express");
const router = express.Router();
const uploadController = require("../controllers/upload.controller");
const {
  verifyTokenAndAuthorization,
  verifyToken,
} = require("../middlewares/Auth");
// Request password reset
router.post("/photo", uploadController.uploadPhoto);


module.exports = router;
