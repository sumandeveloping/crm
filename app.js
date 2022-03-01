const express = require("express");
const mongoose = require("mongoose");
const mysql = require("mysql");
const morgan = require("morgan");
// const cors = require("cors");
const db = require("./connection");
const leadRoutes = require("./routes/leadRoutes");

const app = express();
const port = process.env.PORT || 8000;
// console.log(process.env);

//middleware
app.use(morgan("dev"));
// app.use(
//   cors({
//     origin: "http://127.0.0.1:8000/",
//   })
// ); // for download a file from server
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(`${__dirname}/public`)); //serves the static pages

//router model
app.use("/api/v1/leads", leadRoutes);
app.get("/", (req, res) => {
  res.status(200).json({
    status: "success",
  });
});

// DB connecions
// const DATABASE_LOCAL = "mongodb://127.0.0.1/crm";
// mongoose
//   .connect(DATABASE_LOCAL, {
//     useNewUrlParser: true,
//   })
//   .then(() => {
//     // console.log(con.connection);
//     console.log("DB connection successfully established! 😄");
//   })
//   .catch((err) => {
//     console.log("DB Connection Failed! 😥");
//     console.log(err);
//   });
// * MYSQL server

//server connecions
app.listen(port, () => {
  console.log(`App running on Port: ${port}`);
});
