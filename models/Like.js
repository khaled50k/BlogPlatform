const mongoose = require("mongoose");

const likeSchema = new mongoose.Schema(
  {
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    post: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Post",
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Create a compound unique index to ensure that each user can like a post only once
likeSchema.index({ user: 1, post: 1 }, { unique: true });

const Like = mongoose.model("Like", likeSchema);

module.exports = Like;
