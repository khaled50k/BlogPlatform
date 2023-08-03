const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const {
  verifyTokenAndAuthorization,
  verifyToken,
} = require("../middlewares/Auth");

// Route to register
router.post("/users/register", userController.createUser);
// Route to login
router.post("/users/login", userController.loginUser);
// Route to logout
router.post("/users/logout",verifyToken, userController.logoutUser);
// get users
router.get("/users/data", verifyToken,userController.getUserDataByCookie);
router.get("/users/:id?", userController.getUsers);
// get user data by cookie

// Route to update user details
router.put("/users/:id", userController.updateUser);

// Route to delete a user
router.delete("/users/:id", userController.deleteUser);
// Route to add a follower to a user
router.post("/users/:id/follow", verifyToken, userController.follow);

// Route to remove a follower from a user
router.delete("/users/:id/follow", verifyToken, userController.unfollow);

// Route to get all followers for a user
router.get("/users/:id/followers", userController.getAllFollowers);

// Route to get all followings for a user
router.get("/users/:id/followings", userController.getAllFollowings);

module.exports = router;
