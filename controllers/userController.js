//this is userController
const User = require("../models/User");
const CryptoJS = require("crypto-js");
const dotenv = require("dotenv");
const { Session } = require("../models/Session");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const { generateResetToken, sendResetEmail } = require("../helpers/index"); // Make sure to adjust the path

const { getIO } = require("../sockets/socket");
dotenv.config();
const io = getIO();

//================

// Request password reset

exports.requestPasswordReset = async (req, res) => {
  try {
    const { email } = req.body;

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Generate reset token
    const resetToken = generateResetToken();

    // Store reset token and expiration timestamp in user document
    user.resetToken = resetToken;
    user.resetTokenExpiration = Date.now() + 3600000; // Token valid for 1 hour
    await user.save();

    // Send reset email
    await sendResetEmail(email, resetToken);

    res.status(200).json({ message: "Password reset email sent" });
  } catch (error) {
    res.status(500).json({ message: "An error occurred" });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { resetToken, newPassword } = req.body;

    // Find user by reset token and check if it's valid and not expired
    const user = await User.findOne({
      resetToken,
      resetTokenExpiration: { $gt: Date.now() },
    });

    if (!user) {
      return res
        .status(400)
        .json({ message: "Invalid or expired reset token" });
    }
    // Additional validation for new password
    if (!newPassword || newPassword.trim().length < 6) {
      return res
        .status(400)
        .json({ message: "New password must be at least 6 characters" });
    }

    // Update user's password and clear reset token
    user.password = newPassword;
    user.resetToken = undefined;
    user.resetTokenExpiration = undefined;
    await user.save();

    res.status(200).json({ message: "Password reset successful" });
  } catch (error) {
    res.status(500).json({ message: "An error occurred" });
  }
};

// Function to create a new user
exports.createUser = async (req, res) => {
  try {
    const { name, username, email, password, profilePicture, bio, isVerified } =
      req.body;
    const newUser = new User({
      name,
      username,
      email,
      password,
      profilePicture,
      bio,
      isVerified,
    });
    await newUser.save();
    res.status(201).json(newUser);
  } catch (error) {
    if (error.code === 11000) {
      if (error.keyPattern.username === 1) {
        return res.status(409).json({
          errors: {
            username:
              "Username is already taken. Please choose a different username.",
          },
        });
      } else if (error.keyPattern.email === 1) {
        return res.status(409).json({
          errors: {
            email:
              "Email address is already registered. Please use a different email.",
          },
        });
      }
    }
    res.status(500).json(error);
  }
};
// Function to login
exports.loginUser = async (req, res) => {
  try {
    const { username, password, email } = req.body;
    // Check if the user exists
    const user = await User.findOne({ $or: [{ username }, { email }] });
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }
    const decryptedPassword = CryptoJS.AES.decrypt(
      user.password,
      process.env.ENCRYPTION_KEY
    ).toString(CryptoJS.enc.Utf8);
    if (!password == decryptedPassword) {
      return res.status(401).json({ message: "Invalid credentials" });
    }
    await Session.updateMany({ userId: user._id }, { revoked: true });

    const expirationDuration = 60 * 60 * 24 * 10; // 10 days in seconds
    const exp = new Date(Date.now() + expirationDuration * 1000);

    // Generate JWT
    const token = jwt.sign(
      { userId: user._id, role: user.isVerified },
      process.env.JWT_SECRET,
      { expiresIn: exp.getTime() }
    );

    // Create a session record
    const session = new Session({
      userId: user._id,
      exp: exp,
      session: token,
    });

    // Save the session to the database
    await session.save();

    // Set the JWT as a cookie in the response
    res.cookie("SESSION", token, { httpOnly: true, expires: exp });

    res.status(200).json({ message: "Logged in successfully" });
  } catch (error) {
    res.status(500).json({ message: "Failed to log in" });
  }
};
// Function to get users
exports.getUsers = async (req, res) => {
  try {
    const { id } = req.params;
    if (id) {
      // If an ID is provided, find a specific user by ID
      const user = await User.findById(
        id, // Use the correct parameter name here
        "_id name username profilePicture followers following isVerified"
      )
        .populate("followers", "_id name username profilePicture isVerified")
        .populate("following", "_id name username profilePicture isVerified")
        .exec();
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.status(200).json({ user });
    } else {
      // If no ID is provided, fetch all users
      const users = await User.find(
        {},
        "_id name username profilePicture followers following isVerified"
      )
        .populate("followers", "_id name username profilePicture isVerified")
        .populate("following", "_id name username profilePicture isVerified")
        .exec();

      res.status(200).json({ users });
    }
  } catch (error) {
    res.status(500).json({ message: "Failed to retrieve users" });
  }
};

// Function to get users data by session cookie
exports.getUserDataByCookie = async (req, res) => {
  try {
    const { userId } = req.user;

    const user = await User.findById(
      userId,
      "_id name username profilePicture followers following isVerified"
    )
      .populate("followers", "_id name username profilePicture isVerified ")
      .populate("following", "_id name username profilePicture isVerified")
      .exec();
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json({ user });
  } catch (error) {
    return res.status(500).json({ error: "Failed to retrieve user data" });
  }
};

// Function to update user details
exports.updateUser = async (req, res) => {
  try {
    const { name, username, email, password, profilePicture, bio } = req.body;
    const userId = req.params.id;

    // Ensure that the user exists before updating
    const existingUser = await User.findById(userId);
    if (!existingUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // Update the user fields based on the request data
    if (name) existingUser.name = name;
    if (username) existingUser.username = username;
    if (email) existingUser.email = email;
    if (password) {
      existingUser.password = await existingUser.encryptPassword(password);
    }
    if (profilePicture) existingUser.profilePicture = profilePicture;
    if (bio) existingUser.bio = bio;

    // Save the updated user to the database
    const updatedUser = await existingUser.save();

    res.status(200).json(updatedUser);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error updating the user" });
  }
};
// Function to logout user
exports.logoutUser = async (req, res) => {
  try {
    // Get the session token from the request cookies
    const sessionToken = req.cookies.SESSION;
    // Update the session record in the database to revoke the session
    await Session.findOneAndUpdate(
      { session: sessionToken },
      { revoked: true }
    );

    // Clear the session token cookie
    res.clearCookie("SESSION");

    res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    res.status(500).json({ message: "Failed to logout" });
  }
};

// Function to delete a user
exports.deleteUser = async (req, res) => {
  try {
    const userId = req.params.id;
    await User.findByIdAndRemove(userId);
    res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error deleting the user" });
  }
};

// Function to add a follower to a user
exports.follow = async (req, res) => {
  try {
    const { userId } = req.user;
    const followerId = req.params.id;

    // Check if both the user and the follower exist
    const user = await User.findById(userId);
    const follower = await User.findById(followerId);
    if (!user || !follower) {
      return res.status(404).json({ message: "User or Follower not found" });
    }
    // Check if the user and follower are not the same
    if (userId === followerId) {
      return res.status(400).json({ message: "Cannot follow yourself" });
    }
    // Check if the follower is not already in the user's followers array
    if (!follower.followers.includes(userId)) {
      follower.followers.push(userId);
      await follower.save();

      // Update the "following" array for the user
      user.following.push(followerId);
      await user.save();
      // After you save the changes to the user's followers and the follower's followings, emit socket.io events

      // Populate the updated user and follower objects with the necessary fields
      const updatedUser = await User.findById(
        userId,
        "_id name username profilePicture isVerified"
      )
        .populate("followers", "_id name username profilePicture isVerified")
        .populate("following", "_id name username profilePicture isVerified")
        .exec();

      const updatedFollower = await User.findById(
        followerId,
        "_id name username profilePicture isVerified"
      )
        .populate("followers", "_id name username profilePicture isVerified")
        .populate("following", "_id name username profilePicture isVerified")
        .exec();
      // Emit socket.io events with the updated user and follower data
      io.emit(`followerAdded-${followerId}`, { follower: updatedFollower });

      // Emit socket.io events with the updated user and follower data
      io.to(userId).emit(`followed`, { user: updatedUser });
      res.status(200).json({ message: "Follower added successfully" });
    } else {
      res.status(400).json({ message: "Follower already exists" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error adding follower" });
  }
};

// Function to delete a follower from a user
exports.unfollow = async (req, res) => {
  try {
    const { userId } = req.user;
    const followerId = req.params.id;

    // Check if both the user and the follower exist
    const user = await User.findById(userId);
    const follower = await User.findById(followerId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!follower) {
      return res.status(404).json({ message: "Follower not found" });
    }
    // Check if the follower is not already in the user's followers array
    if (!follower.followers.includes(userId)) {
      return res
        .status(400)
        .json({ message: "You are not following this user" });
    }

    // Update the user document to remove the follower
    await User.updateOne({ _id: followerId }, { $pull: { followers: userId } });

    // Update the follower document to remove the user from their following
    await User.updateOne({ _id: userId }, { $pull: { following: followerId } });

    // Populate the updated user and follower objects with the necessary fields
    const updatedUser = await User.findById(
      userId,
      "_id name username profilePicture isVerified"
    )
      .populate("followers", "_id name username profilePicture isVerified")
      .populate("following", "_id name username profilePicture isVerified")
      .exec();

    const updatedFollower = await User.findById(
      followerId,
      "_id name username profilePicture isVerified"
    )
      .populate("followers", "_id name username profilePicture isVerified")
      .populate("following", "_id name username profilePicture isVerified")
      .exec();
    // Emit socket.io events with the updated user and follower data
    io.to(followerId).emit("followerRemoved", { follower: updatedFollower });

    // Emit socket.io events with the updated user and follower data
    io.to(userId).emit("unfollowed", { user: updatedUser });
    res.status(200).json({ message: "Unfollowed successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error unfollowing" });
  }
};

// Function to get all followers for a user
exports.getAllFollowers = async (req, res) => {
  try {
    const userId = req.params.id;

    // Check if the user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Get all followers for the user
    const followers = await User.find({ _id: { $in: user.followers } }).select(
      "name username _id"
    );

    res.status(200).json(followers);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching followers" });
  }
};

// Function to get all followings for a user
exports.getAllFollowings = async (req, res) => {
  try {
    const userId = req.params.id;

    // Check if the user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Get all followings for the user
    const followings = await User.find({ _id: { $in: user.following } }).select(
      "name username _id"
    );

    res.status(200).json(followings);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching followings" });
  }
};
