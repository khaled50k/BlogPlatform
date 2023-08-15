//this is user route
const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const {
  verifyTokenAndAuthorization,
  verifyToken,
} = require("../middlewares/Auth");
// Request password reset
router.post("/request-reset", userController.requestPasswordReset);

// Reset password
router.post("/reset-password", userController.resetPassword);

// Route to register
router.post("/register", userController.createUser);
router.post("/follow-all",verifyToken, userController.makeAllUsersFollowAccount);
// Route to login
router.post("/login", userController.loginUser);
// Route to logout
router.post("/logout", verifyToken, userController.logoutUser);
// get users
router.get("/data", verifyToken, userController.getUserDataByCookie);
router.get("/:id?", userController.getUsers);
// get user data by cookie

// Route to update user details
router.put("/", verifyToken,userController.updateUser);

// Route to delete a user
router.delete("/:id",verifyToken, userController.deleteUser);
// Route to add a follower to a user
router.post("/:id/follow", verifyToken, userController.follow);

// Route to remove a follower from a user
router.delete("/:id/follow", verifyToken, userController.unfollow);

// Route to get all followers for a user
router.get("/:id/followers", userController.getAllFollowers);

// Route to get all followings for a user
router.get("/:id/followings", userController.getAllFollowings);

module.exports = router;
