const socketio = require("socket.io");

let io;

function init(server) {
  console.log("trying to connect socket");
  io = socketio(server,{
  cors: {
    origin: 'http://localhost:5173',
    credentials: true
  }
});
 
}

function getIO() {
  if (!io) {
    throw new Error("Socket.io not initialized");
  }
  return io;
}

module.exports = { init, getIO };
