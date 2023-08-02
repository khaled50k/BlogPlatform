const express = require("express");
const dotenv = require("dotenv");
const bodyParser = require("body-parser");
const cors=require('cors')
const cookieParser = require("cookie-parser");

const app = express();
dotenv.config();
const usersRoute = require("./routes/User.js");
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
app.use(express.json({ limit: "20kb" }));
app.use(
  cors({
    origin: "*",
  })
);
connectDB();
app.use("/api", usersRoute);
app.listen(3000, () => {
  console.log(`Server running on Port: ${3000}`);
});
