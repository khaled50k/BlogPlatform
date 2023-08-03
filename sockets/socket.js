const socketio = require("socket.io");

let io;

function init(server) {
  console.log("trying to connect socket");
  io = socketio(server);
 
}

function getIO() {
  if (!io) {
    throw new Error("Socket.io not initialized");
  }
  return io;
}

module.exports = { init, getIO };
