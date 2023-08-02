const express = require("express");
const dotenv = require("dotenv");
const bodyParser = require("body-parser");
const app = express();
dotenv.config();
const usersRoute = require("./routes/User.js");
const connectDB = require("./config/database.js");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.json({ limit: "20kb" }));

connectDB();
app.use("/api", usersRoute);
app.listen(3000, () => {
  console.log(`Server running on Port: ${3000}`);
});
