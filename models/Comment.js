// models/Comment.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./User');
const Post = require('./Post');

const Comment = sequelize.define('Comment', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  content: {
    type: DataTypes.STRING,
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

Comment.belongsTo(User, { as: 'author', foreignKey: 'authorId' });
User.hasMany(Comment, { foreignKey: 'authorId' });

Comment.belongsTo(Post, { foreignKey: 'postId' });
Post.hasMany(Comment, { foreignKey: 'postId' });

Comment.belongsTo(Comment, { as: 'parentComment', foreignKey: 'parentCommentId' });
Comment.hasMany(Comment, { as: 'replies', foreignKey: 'parentCommentId' });

module.exports = Comment;
