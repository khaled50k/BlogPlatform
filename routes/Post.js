const express = require("express");
const router = express.Router();
const userController = require("../controllers/postController");
const {
  verifyTokenAndAuthorization,
  verifyToken,
  verifyTokenAndAdmin,
} = require("../middlewares/Auth");

// Route to create post
router.post("/", verifyToken, userController.createPost);
router.delete("/:postId", verifyToken, userController.deletePost);
router.get("/:postId?", verifyToken, userController.getPosts);
router.post("/:postId/like", verifyToken, userController.likePost);
router.post("/:postId/comment", verifyToken, userController.addComment);
router.delete("/:postId/comment/:commentId", verifyToken, userController.deleteComment);

module.exports = router;
