// models/Socket.js
const mongoose = require("mongoose");

const socketSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  socketId: {
    type: String,
    required: true,
  },
});

const Socket = mongoose.model("Socket", socketSchema);

module.exports = Socket;
