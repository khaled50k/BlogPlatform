const mongoose = require("mongoose");
const CryptoJS = require("crypto-js");
const dotenv = require("dotenv");
dotenv.config();
const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true, // Trim whitespace from the beginning and end of the string
      minlength: [2, "Name must be at least 2 characters long"],
      maxlength: [100, "Name cannot exceed 100 characters"],
      // Custom validation for the name format
      validate: {
        validator: function (name) {
          // You can add more complex validation rules here if needed
          return /^[a-zA-Z\s]+$/.test(name);
        },
        message: "Name can only contain letters and spaces",
      },
    },
    username: {
      type: String,
      required: true,
      unique: [true, "Username is taken"],
      trim: true, // Trim whitespace from the beginning and end of the string
      minlength: [3, "Username must be at least 3 characters long"],
      maxlength: [30, "Username cannot exceed 30 characters"],
      // Custom validation for the username format
      validate: {
        validator: function (username) {
          return /^[a-zA-Z0-9_]+$/.test(username);
        },
        message: "Username can only contain letters, numbers, and underscores",
      },
    },
    email: {
      type: String,
      required: true,
      unique: true,
      validate: {
        validator: function (email) {
          // Simple email validation using a regex (you can use a library for more complex validation)
          return /\S+@\S+\.\S+/.test(email);
        },
        message: (props) => `${props.value} is not a valid email address!`,
      },
    },
    password: {
      type: String,
      required: true,
    },
    profilePicture: {
      type: String,
      validate: {
        validator: function (url) {
          // Simple URL validation using a regex (you can use a library for more complex validation)
          return /^(ftp|http|https):\/\/[^ "]+$/.test(url);
        },
        message: (props) => `${props.value} is not a valid URL!`,
      },
    },
    bio: {
      type: String,
    },
    followers: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: "User",
      default: [],
    },
    following: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: "User",
      default: [],
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    verificationToken: {
      type: String,
    },
    resetToken: {
      type: String,
    },
    resetTokenExpiration: {
      type: Date,
    },
  },
  { timestamps: true }
);

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;
console.log(ENCRYPTION_KEY);
// Pre-save middleware to encrypt the password before saving
userSchema.pre("save", function (next) {
  try {
    // Check if the password has been modified before saving
    if (!this.isModified("password")) {
      return next();
    }

    // Encrypt the password using AES encryption
    const encryptedPassword = CryptoJS.AES.encrypt(
      this.password,
      ENCRYPTION_KEY
    ).toString();

    // Replace the plain password with the encrypted password
    this.password = encryptedPassword;
    next();
  } catch (error) {
    return next(error);
  }
});

// Method to decrypt the password (for example, during login)
userSchema.methods.decryptPassword = function () {
  try {
    // Decrypt the password using AES decryption
    const decryptedPassword = CryptoJS.AES.decrypt(
      this.password,
      ENCRYPTION_KEY
    ).toString(CryptoJS.enc.Utf8);
    return decryptedPassword;
  } catch (error) {
    return null;
  }
};
userSchema.methods.encryptPassword = async function (password) {
  return CryptoJS.AES.encrypt(password, ENCRYPTION_KEY).toString();
};

const User = mongoose.model("User", userSchema);

module.exports = User;
