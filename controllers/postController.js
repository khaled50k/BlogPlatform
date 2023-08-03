const Post = require("../models/Post");
const Like = require("../models/Like");
const Comment = require("../models/Comment");
const dotenv = require("dotenv");
const { getIO } = require("../sockets/socket");
dotenv.config();
const io = getIO();
// Controller function to create a new post
exports.createPost = async (req, res) => {
  try {
    const { title, content, postPicture } = req.body;
    const author = req.user.userId; // Assuming you have middleware to get the authenticated user's ID

    const newPost = new Post({
      title,
      content,
      postPicture,
      author,
    });

    const savedPost = await newPost.save();

    res.status(201).json({ message: "Post created successfully" });
  } catch (error) {
    res.status(500).json({ message: "Failed to create the post" });
  }
};

// Controller to handle deleting a post and its associated likes and comments
exports.deletePost = async (req, res) => {
    try {
      const { postId } = req.params;
      const { userId } = req.user;
  
      // Check if the post exists and belongs to the user
      const post = await Post.findByIdAndRemove({ _id: postId, author: userId });
      if (!post) {
        return res.status(404).json({ message: "Post not found or not owned by the user" });
      }
  
      // Delete the post

      // Delete all likes associated with the post
      await Like.deleteMany({ post: postId });
  
      // Delete all comments associated with the post
      await Comment.deleteMany({ post: postId });
  
      res.status(200).json({ message: "Post and associated likes and comments deleted successfully" });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to delete the post" });
    }
  };
// Controller function to get  posts

exports.getPosts = async (req, res) => {
  try {
    const { userId, postId } = req.params;
    console.log(postId);
    if (postId) {
      // If a post ID is provided, find the specific post by ID
      const post = await Post.findById(postId)
        .populate('author', '_id name username profilePicture isVerified')
        .populate({
            path: 'likes',
            populate: {
              path: 'author',
              select: '_id name username profilePicture isVerified',
            },
          })
        .populate({
          path: 'comments',
          populate: {
            path: 'author',
            select: '_id name username profilePicture isVerified',
          },
        })
        .exec();

      if (!post) {
        return res.status(404).json({ message: 'Post not found' });
      }

      res.status(200).json({ post });
    }

     else {
    // If no user ID or post ID is provided, fetch all posts
    const posts = await Post.find({}).populate('author', '_id name username profilePicture isVerified')
    .populate({
        path: 'likes',
        populate: {
          path: 'author',
          select: '_id name username profilePicture isVerified',
        },
      })
    .populate({
      path: 'comments',
      populate: {
        path: 'author',
        select: '_id name username profilePicture isVerified',
      },
    })
    .exec();


    res.status(200).json({ posts });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to retrieve posts" });
  }
};

// Controller to handle liking a post

exports.likePost = async (req, res) => {
  try {
    const { postId } = req.params;
    const { userId } = req.user;

    // Check if the post exists
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    // Check if the user has already liked the post
    const existingLike = await Like.findOne({ user: userId, post: postId });

    if (existingLike) {
      // User has already liked the post, so we remove the like
      await existingLike.remove();
      // Update the `likes` field in the Post document to remove the like
      await Post.findByIdAndUpdate(postId, {
        $pull: { likes: existingLike._id },
      });
      res.status(200).json({ message: "Post like removed successfully" });
    } else {
      // User has not liked the post, so we create a new like
      const like = new Like({
        author: userId,
        post: postId,
      });

      // Save the like document
      await like.save();

      // Update the `likes` field in the Post document to add the new like
      await Post.findByIdAndUpdate(postId, { $push: { likes: like._id } });
      res.status(200).json({ message: "Post liked successfully" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to like/unlike the post" });
  }
};


// Controller to handle adding a comment to a post
exports.addComment = async (req, res) => {
  try {
    const { postId } = req.params;
    const { userId } = req.user;
    const { content } = req.body;

    // Check if the post exists
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    // Create a new comment document
    const comment = new Comment({
      content,
      author: userId,
      post: postId,
    });

    // Save the comment document
    await comment.save();

    // Update the `comments` field in the Post document to add the new comment
    await Post.findByIdAndUpdate(postId, { $push: { comments: comment._id } });

    res.status(200).json({ message: "Comment added successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to add the comment" });
  }
};

// Controller to handle deleting a comment from a post
exports.deleteComment = async (req, res) => {
    try {
      const { postId, commentId } = req.params;
      const { userId } = req.user;
  
      // Check if the post exists
      const post = await Post.findById(postId);
      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }
  
      // Check if the comment exists and belongs to the user
      const comment = await Comment.findOneAndDelete({ _id: commentId, author: userId });
      if (!comment) {
        return res.status(404).json({ message: "Comment not found or not owned by the user" });
      }
  
      // Update the `comments` field in the Post document to remove the deleted comment
      await Post.findByIdAndUpdate(postId, { $pull: { comments: commentId } });
  
      res.status(200).json({ message: "Comment deleted successfully" });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to delete the comment" });
    }
  };