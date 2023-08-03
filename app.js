const express = require("express");
const dotenv = require("dotenv");
const bodyParser = require("body-parser");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const { init,getIO } = require("./sockets/socket");
const http = require("http");

const app = express();
const server = http.createServer(app);
init(server); // Initialize Socket.IO

dotenv.config();
const usersRoute = require("./routes/User.js");
const postsRoute = require("./routes/Post.js");
const connectDB = require("./config/database.js");




app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, OPTIONS"
  );
  res.setHeader("Access-Control-Allow-Credentials", "true");
  next();
});

app.use(cookieParser());

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Enable CORS
app.use(
  cors({
    origin: "*",
  })
);

connectDB();
app.use("/api/users", usersRoute);
app.use("/api/post", postsRoute);

// Socket.IO connection and event handling

getIO().on("connection", (socket) => {
  console.log("A new user has connected");
 


  // Handle disconnect event
  socket.on("disconnect", () => {
    console.log("A user has disconnected");
    // Add your logic here to handle user disconnection if needed
  });
});
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on Port: ${PORT}`);
});
