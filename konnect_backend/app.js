const express = require("express");
const app = express();
const crypto = require("crypto");
const mongoose = require("mongoose");
const http = require("http").createServer(app);
const redis = require("redis");
const connectRedis = require("connect-redis");
require("dotenv").config();
const { check } = require("express-validator");
const session = require("express-session");
const { v4: uuidv4 } = require("uuid");

const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

const { PeerServer } = require("peer");
const io = require("socket.io")(http);

// enable this if you run behind a proxy (e.g. nginx)
app.set("trust proxy", 1);

const User = require("./DB/user");
const Room = require("./DB/room");

const cookie = require("cookie");

const PORT = process.env.PORT || 3001;

const RedisStore = connectRedis(session);

//Configure redis client
const redisClient = redis.createClient({
  host: process.env.REDISHOST,
  port: 6379,
});

redisClient.on("error", function (err) {
  console.log("Could not establish a connection with redis. " + err);
});

redisClient.on("connect", function (err) {
  console.log("Connected to redis successfully");
});

app.use(
  session({
    store: new RedisStore({ client: redisClient }),
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { httpOnly: true, sameSite: "strict" },
  })
);

const cors = require("cors");

app.use(
  cors({
    origin: process.env.PROD_URL ?? "http://localhost:3000",
    methods: ["POST", "PUT", "GET", "OPTIONS", "DELETE"],
    credentials: true,
  })
);

app.use(function (req, res, next) {
  req.user = "user" in req.session ? req.session.user : null;
  req.name = "name" in req.session ? req.session.name : null;
  console.log(
    "HTTP request\n",
    req.user + "\n",
    req.name + "\n",
    req.method + "\n",
    req.url,
    req.body,
    req.session
  );
  next();
});

let isAuthenticated = function (req, res, next) {
  if (!req.user) return res.status(401).json({ error: "Unauthorized" });
  next();
};

mongoose
  .connect(
    `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@konnectcluster0.p7ztj.mongodb.net/Konnect`,
    { useNewUrlParser: true, useUnifiedTopology: true }
  )
  .then((result) =>
    http.listen(PORT, function () {
      console.log("HTTP server on http://localhost:%s", PORT);
    })
  )
  .catch((err) => console.log("Connection failed" + err));

mongoose.set("useFindAndModify", false);

// signup
app.post(
  "/api/signup/",
  [
    check("username").isLength({ min: 6 }).isAlpha().trim().escape(),
    check("password").isLength({ min: 8 }).isAlpha().trim().escape(),
    check("firstname").isLength({ max: 15 }).isAlpha().trim().escape(),
    check("lastname").isLength({ max: 15 }).isAlpha().trim().escape(),
  ],
  function (req, res, next) {
    let firstname = req.body.firstname;
    let lastname = req.body.lastname;
    let username = req.body.username;
    let password = req.body.password;

    User.findOne({ username: username }, function (err, user) {
      if (err) return res.status(500).end(err);
      if (user)
        return res
          .status(409)
          .json({ error: "username " + username + " already exists" });

      let salt = crypto.randomBytes(16).toString("base64");
      let hash = crypto.createHmac("sha512", salt);
      hash.update(password);
      let saltedHash = hash.digest("base64");
      User.create(
        {
          firstname: firstname,
          lastname: lastname,
          username: username,
          originalPassword: req.body.password,
          password: saltedHash,
          salt: salt,
        },
        function (err, user) {
          if (err) return res.status(500).end(err);
          req.session.key = username;
          req.session.user = user._id;
          req.session.name = user.firstname + " " + user.lastname;
          res.setHeader("Set-Cookie", cookie.serialize("id", user._id), {
            path: "/",
            maxAge: 60 * 60 * 24 * 7,
          });
          return res.json(user._id);
        }
      );
    });
  }
);

app.post(
  "/api/signin/",
  [check("username").trim().escape(), check("password").trim().escape()],
  function (req, res, next) {
    let username = req.body.username;
    let password = req.body.password;

    User.findOne({ username: username }, function (err, user) {
      if (err) return res.status(500).end(err);
      if (!user)
        return res
          .status(401)
          .json({ error: "User does not exist. Access denied." }); // user doesn't exist

      req.session.key = username;
      req.session.user = user._id;
      req.session.name = user.firstname + " " + user.lastname;
      let hash = crypto.createHmac("sha512", user.salt);
      hash.update(password);
      let saltedHash = hash.digest("base64");

      if (user.password !== saltedHash)
        return res
          .status(401)
          .json({ error: "Invalid password. Access denied." }); // invalid password
      // start a session
      res.setHeader("Set-Cookie", cookie.serialize("id", user._id), {
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
      });
      return res.json(user._id);
    });
  }
);

// Logs out of the website
app.get("/api/signout/", function (req, res, next) {
  req.session.destroy();
  res.clearCookie("connect.sid", { path: "/" });
  return res.json("Successfully logged out");
});

// Gets data for the user's home page
app.get("/api/getHomeData/:id/", isAuthenticated, function (req, res, next) {
  let id = req.params.id;
  User.findOne({ _id: id }, function (err, user) {
    if (err) return res.status(500).end(err);
    if (!user) return res.status(404).json({ error: "User does not exist" });

    res.setHeader("Set-Cookie", cookie.serialize("id", user._id), {
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return res.json({
      firstname: user.firstname,
      lastname: user.lastname,
      username: user.username,
      password: user.originalPassword,
    });
  });
});

// Updates the user's profile
app.put("/api/editProfile/:id/", isAuthenticated, function (req, res, next) {
  let id = req.body.id;
  let firstname = req.body.firstname;
  let lastname = req.body.lastname;
  let username = req.body.username;
  let originalPassword = req.body.password;

  User.findOne({ username: username, _id: { $ne: id } }, function (err, user) {
    if (err) return res.status(500).end(err);
    if (user) {
      return res.status(409).json({ error: "Username already exists" });
    }

    // Creates the salt and hashed password
    let salt = crypto.randomBytes(16).toString("base64");
    let hash = crypto.createHmac("sha512", salt);
    hash.update(originalPassword);
    let password = hash.digest("base64");

    // Creates an object for the new information
    newInfo = {
      firstname: firstname,
      lastname: lastname,
      username: username,
      originalPassword: originalPassword,
      salt: salt,
      password: password,
    };

    User.findOneAndUpdate(
      { _id: id },
      { $set: newInfo },
      { new: true },
      function (err, user) {
        if (err) return res.status(500).end(err);
        if (!user)
          return res.status(404).json({ error: "User does not exist" });

        res.setHeader("Set-Cookie", cookie.serialize("id", user._id), {
          path: "/",
          maxAge: 60 * 60 * 24 * 7,
        });
        return res.json({
          user,
        });
      }
    );
  });
});

// Function used to create new room
app.get("/api/createRoom/", isAuthenticated, function (req, res, next) {
  let roomID = uuidv4();
  Room.create(
    {
      id: roomID,
      host: req.session.key,
      numPeople: 0,
    },
    function (err, room) {
      if (err) return res.status(500).end(err);
      return res.json({ room });
    }
  );
});

// Function used to get the user id
app.get("/api/userId/", isAuthenticated, function (req, res, next) {
  return res.json({ id: req.user });
});

// Function used to get the user name
app.get("/api/userName/", function (req, res, next) {
  return res.json({ name: req.session.name });
});

//PEERJS SERVER
const peerServer = PeerServer({
  port: process.env.PROD ? 443 : 9000,
  path: "/",
  secure: process.env.PROD !== undefined, // enables https
});

peerServer.on("connection", (client) => {
  console.log("connected: " + client);
});

// WEBSOCKET
io.on("connection", (socket) => {
  console.log("connected");
  // For joining a room.
  socket.on("join-room", (userData) => {
    console.log("Join-Room");
    socket.emit("newMessage", {
      author: "konnect-bot",
      message: "Welcome to Konnect",
    });

    const { roomID, userID } = userData;
    socket.join(roomID);
    // notify that a new user has joined along with their user data
    socket.to(roomID).broadcast.emit("new-user-connect", userData);
    addUser(roomID);

    socket.on("disconnect", () => {
      socket.to(roomID).broadcast.emit("user-disconnected", userID);
      removeUser(roomID);
    });

    socket.on("message", (data) => {
      console.log(data);
      socket.to(roomID).broadcast.emit("newMessage", {
        author: data.author,
        message: data.message,
      });
    });
  });
});

function addUser(roomID) {
  Room.findOne({ id: roomID }, function (err, room) {
    if (err) return err;
    if (!room) {
      return "Room " + roomID + " does not exist";
    }

    // Creates an object for the new information
    newInfo = {
      numPeople: room.numPeople + 1,
    };

    Room.findOneAndUpdate(
      { id: roomID },
      { $set: newInfo },
      { new: true },
      function (err, room) {
        if (err) return err;
      }
    );
  });
}

function removeUser(roomID) {
  Room.findOne({ id: roomID }, function (err, room) {
    if (err) return err;
    if (!room) {
      return "Room " + roomID + " does not exist";
    }

    let numPeopleInRoom = room.numPeople - 1;

    // Creates an object for the new information
    newInfo = {
      numPeople: room.numPeople - 1,
    };

    if (numPeopleInRoom <= 0) {
      Room.deleteOne({ id: roomID }, function (err, room) {
        if (err) return err;
      });
    }

    Room.findOneAndUpdate(
      { id: roomID },
      { $set: newInfo },
      { new: true },
      function (err, room) {
        if (err) return err;
      }
    );
  });
}

// Function used to get the number of people in a room
function getNumPeople(roomID) {
  Room.findOne({ id: roomID }, function (err, room) {
    if (err) return err;
    if (!room) {
      return "Room " + roomID + " does not exist";
    }

    return room.numPeople;
  });
}
