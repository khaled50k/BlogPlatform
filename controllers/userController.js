const User = require("../models/User");
const CryptoJS = require("crypto-js");
const dotenv = require("dotenv");
const { Session } = require("../models/Session");
const jwt = require("jsonwebtoken");
dotenv.config();

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
      { userId: user._id, role: user.role },
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
      const user = await User.findById(id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.status(200).json({ user });
    } else {
      // If no ID is provided, fetch all users
      const users = await User.find({});
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

    const user = await User.findById(userId);
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
exports.addFollower = async (req, res) => {
  try {
    const { followerId } = req.body;
    const userId = req.params.id;

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
    if (!user.followers.includes(followerId)) {
      user.followers.push(followerId);
      await user.save();
      res.status(200).json({ message: "Follower added successfully" });
    } else {
      res.status(400).json({ message: "Follower already exists" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error adding follower" });
  }
};
// Function to add a following to a user
exports.addFollowing = async (req, res) => {
  try {
    const { followingId } = req.user;
    const userId = req.params.id;
    console.log(userId);
    // Check if both the user and the follower exist
    const user = await User.findById(userId);
    const following = await User.findById(followingId);
    if (!user || !following) {
      return res.status(404).json({ message: "User or Following not found" });
    }
    // Check if the user and following user are not the same
    if (userId === followingId) {
      return res.status(400).json({ message: "Cannot follow yourself" });
    }
    // Check if the following user is not already in the user's following array
    if (!user.following.includes(followingId)) {
      user.following.push(followingId);
      await user.save();
      res.status(200).json({ message: "Following user added successfully" });
    } else {
      res.status(400).json({ message: "Following user already exists" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error adding following" });
  }
};

// Function to delete a follower from a user
exports.deleteFollower = async (req, res) => {
  try {
    const { followerId } = req.body;
    const userId = req.params.id;

    // Check if both the user and the follower exist
    const user = await User.findById(userId);
    const follower = await User.findById(followerId);
    if (!user || !follower) {
      return res.status(404).json({ message: "User or Follower not found" });
    }

    // Remove the follower from the user's followers array
    const followerIndex = user.followers.indexOf(followerId);
    if (followerIndex !== -1) {
      user.followers.splice(followerIndex, 1);
      await user.save();
    }

    res.status(200).json({ message: "Follower removed successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error removing follower" });
  }
};
// Function to delete a followings from a user
exports.deleteFollowing = async (req, res) => {
  try {
    const { followingId } = req.body;
    const userId = req.params.id;

    // Check if both the user and the follower exist
    const user = await User.findById(userId);
    const following = await User.findById(followingId);
    if (!user || !following) {
      return res.status(404).json({ message: "User or Following not found" });
    }

    // Remove the follower from the user's followers array
    const followingIndex = user.following.indexOf(followingId);
    if (followingIndex !== -1) {
      user.following.splice(followingIndex, 1);
      await user.save();
    }

    res.status(200).json({ message: "Following removed successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error removing following" });
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
    const followers = await User.find({ _id: { $in: user.followers } });

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
    const followings = await User.find({ _id: { $in: user.following } });

    res.status(200).json(followings);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching followings" });
  }
};
