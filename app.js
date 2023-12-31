// app.js
const express = require("express");
const dotenv = require("dotenv");
const uuid = require("uuid");
const bodyParser = require("body-parser");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const { init, getIO } = require("./sockets/socket");
const http = require("http");
const jwt = require("jsonwebtoken");
const app = express();
const server = http.createServer(app);
init(server); // Initialize Socket.IO
dotenv.config();
const postsRoute = require("./routes/Post.js");
const usersRoute = require("./routes/User.js");
const uploadRoute = require("./routes/Upload.js");
const connectDB = require("./config/database.js");
const Socket = require("./models/Socket");
const fileupload = require("express-fileupload");
const User = require("./models/User");
const fs = require("fs");

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, OPTIONS"
  );
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.header("Access-Control-Allow-Origin", "http://localhost:5173");

  next();
});

app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(fileupload({ useTempFiles: true }));
// Enable CORS
connectDB();
app.use(
  cors({
    origin: "http://localhost:5173", // Replace this with the correct origin URL
    credentials: true,
  })
);

const dataPath = "./generated_users.json"; // Adjust the path to the JSON file
const generatedData = JSON.parse(fs.readFileSync(dataPath, "utf8"));
async function insertGeneratedData() {
  try {
    await User.insertMany(generatedData);
    console.log("Generated data inserted into MongoDB");
  } catch (error) {
    console.error("Error inserting data:", error);
  }
}


// Set up Socket.IO connection and event handling
const io = getIO();
// io.use((socket, next) => {
//   const cookieHeader = socket.handshake.headers.cookie;
//   const SESSION = cookieHeader
//     .split("; ")
//     .find((row) => row.startsWith("SESSION="))
//     .split("=")[1];
//   const userIdFromQuery = socket.handshake.query.userId;
//   jwt.verify(SESSION, process.env.JWT_SECRET, async (err, user) => {
//     if (err) {
//       console.log('------------');
//       return next(new Error("Unauthorized"));
//     }
//     try {

//       // Check if the session exists and is not revoked
//       const session = await Session.findOne({ session: SESSION });
//       console.log('------------');
//       console.log(user);
//       console.log('------------');

//       if (!session || session.revoked) {
//         return next(new Error("Unauthorized"));
//       }

//       const currentTime = new Date().getTime();

//       // Check if the current time is greater than or equal to the session expiration time
//       if (currentTime >= session.exp.getTime()) {
//         return next(new Error("Unauthorized"));
//       }

//       if (user.userId !== userIdFromQuery) {
//         // If they don't match, reject the socket connection
//         return next(new Error("Unauthorized"));
//       }

//       next();
//     } catch (error) {
//       return next(new Error("Unauthorized"));
//     }
//   });
// });

io.on("connection", async (socket) => {
  console.log("A new user has connected");

  const userId = socket.handshake.query.userId;
  const socketId = uuid.v4();

  // Find and store the socket information in the database
  await Socket.findOneAndUpdate(
    { userId },
    { socketId: socketId },
    { upsert: true }
  );
  socket.id = socketId;
  console.log("socketId" + socketId);
  // Handle disconnect event
  socket.on("disconnect", async () => {
    // await Socket.findOneAndDelete({ userId });
    console.log("A user has disconnected");
    await Socket.findOneAndDelete({ userId, socketId });
  });
});

// Make the io object available to your routes by attaching it to the request object
app.use((req, res, next) => {
  req.io = io;
  next();
});

app.use("/api/users", usersRoute);
app.use("/api/post", postsRoute);
app.use("/api/upload", uploadRoute);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on Port: ${PORT}`);
});

// insertGeneratedData();