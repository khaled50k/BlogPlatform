const express = require("express");
const router = express.Router();
const userController = require('../controllers/userController');

// Route to register
router.post('/users', userController.createUser);
// Route to login
router.post('/users/login', userController.loginUser);
// Route to login
router.post('/users/logout', userController.logoutUser);
// get users
router.get('/users/:id?', userController.getUsers);
// get user data by cookie
router.post('/users/data', userController.getUserDataByCookie);

// Route to update user details
router.put('/users/:id', userController.updateUser);

// Route to delete a user
router.delete('/users/:id', userController.deleteUser);
// Route to add a follower to a user
router.post('/users/:id/followers', userController.addFollower);

// Route to remove a follower from a user
router.delete('/users/:id/followers', userController.deleteFollower);
// Route to add a follower to a user
router.post('/users/:id/followings', userController.addFollowing);

// Route to remove a following from a user
router.delete('/users/:id/followings', userController.deleteFollowing);

// Route to get all followers for a user
router.get('/users/:id/followers', userController.getAllFollowers);

// Route to get all followings for a user
router.get('/users/:id/followings', userController.getAllFollowings);

module.exports = router;