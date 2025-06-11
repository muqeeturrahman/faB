const express = require("express");
const http = require("http");
const cors = require("cors");
const API = require("./api/index.js");

const DB_CONNECT = require("./config/dbConnect.js");
const { errorHandler } = require("./middlewares/errorHandling.js");
const {io}=require("./socket/socket.js")
require("dotenv").config();
require("./jobs/myjobs")
require('./utils/pushNotification')
const PORT = process.env.PORT;
const app = express();
const server = http.createServer(app);
io(server);
new DB_CONNECT();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// app.use('/public', express.static(path.join(__dirname, 'public')));
app.use("/uploads", express.static("uploads"));
app.get("/", (req, res) => res.json({ message: "Welcome to the Fate API" }));

new API(app).registerGroups();
app.use(errorHandler);

server.listen(PORT, () => console.log(`Server port ${PORT}`));
