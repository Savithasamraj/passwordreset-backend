const express = require("express");
const app = express();
const cors = require("cors");
const bcryptjs = require("bcryptjs");
const mongodb = require("mongodb");
const mongoClient = mongodb.MongoClient;
const dotenv = require("dotenv").config();
const URL = process.env.db;

const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
var randomstring = require("randomstring");

app.use(express.json());
app.use(
  cors({
    origin: "*",
  })
);

app.post("/register", async function (req, res) {
  try {
    const connection = await mongoClient.connect(URL);
    console.log("data10");
    const db =  connection.db("password");
    
    console.log("data");
    const salt = await bcryptjs.genSalt(10);
    const hash = await bcryptjs.hash(req.body.password, salt);
    req.body.password = hash;
    await db.collection("users").insertOne(req.body);
    console.log("data2");
    await connection.close();
    res.json({
      message: "Successfully Registered",
    });
  } catch (error) {
    res.json({
      message: "Error",
    });
  }
});

app.post("/", async function (req, res) {
  try {
    const connection = mongoClient.connect(URL);

    const db = await connection.db("password");

    const user = await db
      .collection("users")
      .findOne({ username: req.body.username });

    if (user) {
      const match = await bcryptjs.compare(req.body.password, user.password);
      if (match) {
        // Token
        const token = jwt.sign({ _id: user._id }, process.env.SECRET);

        res.json({
          message: "Welcome to Query Ticket Raising Portal",
          token,
        });
      } else {
        res.json({
          message: "Password is incorrect",
          token,
          _id,
        });
      }
    } else {
      res.json({
        message: "User not found",
      });
    }
  } catch (error) {
    console.log("error");
  }
});
app.post("/reset", async (req, res) => {
  try {
    const connection = await mongoClient.connect(URL);
    const db = connection.db("password");
    const user = await db
      .collection("users")
      .findOne({ email: request.body.email });
    if (user) {
      let mailid = req.body.email;
    } else {
      res.json({
        message: "email id didnot match",
      });
    }
  } catch (error) {
    console.log(error);
  }
});

app.listen(process.env.PORT||5000, () => {
  console.log("server running");
});
