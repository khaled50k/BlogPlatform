// models/Post.js
const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");
const User = require("./User");
const Comment = require("./Comment");

const Post = sequelize.define("Post", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  content: {
    type: DataTypes.TEXT("long"),
    allowNull: false,
  },
  createdAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
  updatedAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
});

Post.belongsTo(User, { as: "author", foreignKey: "authorId" });
User.hasMany(Post, { foreignKey: "authorId" });

Post.belongsToMany(User, {
  through: "PostLike",
  as: "likedBy",
  foreignKey: "postId",
});
User.belongsToMany(Post, {
  through: "PostLike",
  as: "likedPosts",
  foreignKey: "userId",
});

Post.hasMany(Comment, { foreignKey: "postId" });
Comment.belongsTo(Post, { foreignKey: "postId" });

module.exports = Post;
