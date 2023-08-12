const mongoose = require("mongoose");
const Like = require("./Like");
const Comment = require("./Comment"); // Import the Comment model

const postSchema = new mongoose.Schema({
  content: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
  postPicture: {
    type: String,
    validate: {
      validator: function (url) {
        // Simple URL validation using a regex (you can use a library for more complex validation)
        return /^(ftp|http|https):\/\/[^ "]+$/.test(url);
      },
      message: (props) => `${props.value} is not a valid URL!`,
    },
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User", // Reference to the User model
  },
// likes field in Post schema
likes: [
  {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Like",
  },
],

  comments: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Comment",
    },
  ],
});

const Post = mongoose.model("Post", postSchema);

module.exports = Post;
