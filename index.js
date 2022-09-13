const express = require("express");
const app = express();
const cors = require("cors");
const bcryptjs = require("bcryptjs");
const mongodb = require("mongodb");
const mongoClient = mongodb.MongoClient;
const dotenv = require("dotenv").config();
const URL =
  "mongodb+srv://savitha:Savitha19@cluster0.ngd5ggy.mongodb.net/?retryWrites=true&w=majority";

const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
var randomstring = require("randomstring");
const { response } = require("express");

app.use(express.json());
app.use(
  cors({
    origin: "*",
  })
);
let authenticate = function (request, response, next) {
  // console.log(request.headers);
  if (request.headers.authorization) {
    let verify = jwt.verify(request.headers.authorization, process.env.SECRET);
    console.log(verify);
    if (verify) {
      request.userid = verify.id;

      next();
    } else {
      response.status(401).json({
        message: "Unauthorized",
      });
    }
  } else {
    response.status(401).json({
      message: "Unauthorized",
    });
  }
};
app.post("/register", async function (req, res) {
  console.log("register");
  try {
    const connection = await mongoClient.connect(URL);
    console.log("data10");
    const db = connection.db("password");
    console.log(db);
    const salt = await bcryptjs.genSalt(10);
    console.log(salt);
    const hash = await bcryptjs.hash(req.body.password, salt);
    req.body.password = hash;
    console.log(hash);
    await db.collection("login").insertOne(req.body);
    console.log(req.body);
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
    const connection = await mongoClient.connect(URL);
    console.log("data1");
    const db = connection.db("password");
    console.log("data2");
    const user = await db
      .collection("login")
      .findOne({ email: req.body.email });
    console.log("data3");
    if (user) {
      const match = await bcryptjs.compare(req.body.password, user.password);
      if (match) {
        // Token
        const token = jwt.sign({ _id: user._id }, process.env.SECRET);

        res.json({
          message: "successfully logged in",
          token,
        });
      } else {
        res.json({
          message: "Password is incorrect",
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
      .collection("login")
      .findOne({ email: req.body.email });
      console.log("email")
    if (user) {
      let mailid = req.body.email;
      let string = randomstring.generate(8);
      let link = "http://localhost:3000/resetpage";
      console.log(string)
      console.log(mailid)
      await db
        .collection("login")
        .updateOne({ email: mailid }, { $set: { string: string } });
        console.log(string)
        console.log(mailid)
         await connection.close()
      var transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: "savitestmail44@gmail.com",
          password: process.env.password,
        },
      });
      var mailoptions = {
        from: "savitestmail44@gmail.com",
        to: mailid,
        subject: "password reset",
        text: `Your Random text is ${string}. Click the link to reset password ${link}`,
        html: `<h2>Your Random text is ${string}. Click the link to reset password ${link}</h2>`,
      };
      transporter.sendMail(mailoptions, function (error, info) {
        if (error) {
          res.json({
            message:error,
          });
        } else {
          console.log("Email sent: " + info.response);
          res.json({
            message: "email sent",
          });
        }
      });
    } else {
      res.json({
        message: "email id didnot match",
      });
    }
  } catch (error) {
    console.log(error);
  }
});

app.post("/resetpage", async function (request, response) {
  let mailid = request.body.email;
  let string = request.body.string;
  try {
    const connection = await mongoClient.connect(URL);
    const db = connection.db("password");
    const salt = await bcryptjs.genSalt(10);
    const hash = await bcryptjs.hash(request.body.password, salt);
    request.body.password = hash;
    const user = await db
      .collection("users")
      .findOne({ email: request.body.email });
    if (user) {
      if (user.string === request.body.string) {
        await db
          .collection("users")
          .updateOne(
            { string: string },
            { $set: { password: request.body.password } }
          );
        response.json({
          message: "Password reset done",
        });
      } else {
        response.json({
          message: "Random String is incorrect",
        });
      }
    } else {
      response.json({
        message: "Email Id not match / User not found",
      });
    }
    await db
      .collection("users")
      .updateOne({ string: string }, { $unset: { string: "" } });
  } catch (error) {
    console.log(error);
  }
});

app.post("/dashboard", authenticate, async function (request, response) {
  try {
    const connection = await mongoClient.connect(URL);
    const db = connection.db("password");
    request.body.userid = mongodb.ObjectId(request.userid);
    // request.body.userid = mongodb.ObjectId(request.userid)
    await db.collection("data").insertOne(request.body);
    await connection.close();
    response.json({
      message: "Data added!!",
    });
  } catch (error) {
    console.log(error);
  }
});

app.get("/dashboard", authenticate, async function (request, response) {
  try {
    const connection = await mongoClient.connect(URL);
    const db = connection.db("password");
    let userdata = await db
      .collection("data")
      .find({ userid: mongodb.ObjectId(request.userid) })
      .toArray();
    await connection.close();
    response.json(userdata);
  } catch (error) {
    console.log(error);
  }
});

app.listen(process.env.PORT || 5002, () => {
  console.log("server running");
});
