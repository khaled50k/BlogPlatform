const mongoose = require("mongoose");

const socketSchema = new mongoose.Schema({
  socketId: {
    type: String,
    required: true,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
});

const Socket = mongoose.model("SocketInfo", socketSchema);

module.exports = Socket;
