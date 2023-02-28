const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const { v4: uuid } = require("uuid");
const app = express();
const data = require("./data");
const listUsers = require("./user.json");
const listVote = require("./vote.json");
const fs = require("fs");
const optionCookies ={
  // expires: new Date(Date.now() + (24*60*60*1000)),
  sameSite:'none',
  secure:true,
  // httpOnly: true,
  maxAge: 1000 * 60 * 15,
  // signed: true
}
const corsOptions = {
  origin: [
    "http://localhost:3000",
    "https://frontend-test-fe.vercel.app",
    // "*"
  ],
  credentials: true,
  // allowedHeaders:'*'
  // exposedHeaders:'set-cookie'
  exposedHeaders: ["set-cookie"],
};
app.use(cors(corsOptions));
// app.use(function(req, res, next) {
//   res.header("Access-Control-Allow-Origin", "*"); // update to match the domain you will make the request from
//   res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
//   next();
// });
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());
// app.all('/*', function(req, res, next) {
//   res.header("Access-Control-Allow-Origin", "*");
//   res.header("Access-Control-Allow-Headers", "X-Requested-With");
//   next();
// });
const saveUser = async (listUser) => {
  try {
    console.log("🚀 ~ file: api.js:24 ~ saveUser ~ listUser:", listUser);
    await fs.writeFileSync(`${__dirname}/user.json`, JSON.stringify(listUser));
  } catch (error) {
    console.log("🚀 ~ file: api.js:25 ~ saveUser ~ error:", error);
  }
};
const saveVote = async (listVote) => {
  try {
    console.log("🚀 ~ file: api.js:24 ~ saveUser ~ listUser:", listVote);
    await fs.writeFileSync(`${__dirname}/vote.json`, JSON.stringify(listVote));
  } catch (error) {
    console.log("🚀 ~ file: api.js:25 ~ saveUser ~ error:", error);
  }
};
app.get("/", (req, res) => {
  res.json({"message": "Hello"})
})
app.get("/getJoke", (req, res) => {
  try {
    const cookieUser = req.cookies.user;
    console.log("🚀 ~ file: index.js:54 ~ app.get ~ cookieUser:", cookieUser)
    const index = Math.floor(Math.random() * data.length);
    let joke = {};

    if(cookieUser){
      const userIndex = listUsers.findIndex((el) => el.id == cookieUser);
      const user = listUsers[userIndex];
      if(user){
        const jokeId = user.jokeId[user.jokeId.length - 1];
        joke = data.find((el) => el.id === jokeId);
      }else{
        const userId = uuid();
        res.cookie("user", userId,optionCookies);
        joke = data[index];
        listUsers.push({
          id: userId,
          jokeId: [joke.id],
        });
        saveUser(listUsers);
      }
    }else{
      const userId = uuid();
      res.cookie("user", userId,optionCookies);
      joke = data[index];
      listUsers.push({
        id: userId,
        jokeId: [joke.id],
      });
      saveUser(listUsers);
    }
    
    return res
      .status(200)
      .send({ message: "", success: true, data: { ...joke } });
  } catch (error) {
    console.log("🚀 ~ file: index.js:72 ~ app.get ~ error:", error)
    res.status(500).send({ error: error });
  }
});

app.post("/vote/:jokeId", (req, res) => {
  try {
    const { jokeId } = req.params;
    const { payload } = req.body;
    const cookieUser = req.cookies.user;

    const userIndex = listUsers.findIndex((el) => el.id == cookieUser);
    if (listUsers[userIndex].jokeId.length == data.length) {
      return res.status(200).send({ message: "Vote faild", success: false });
    }
    const listJokeId = listUsers[userIndex].jokeId;
    const _data = data.filter((item) => !listJokeId.includes(item.id));
    const index = Math.floor(Math.random() * _data.length);
    const newData = _data[index];
    listUsers[userIndex].jokeId.push(newData.id);
    saveUser(listUsers);

    const voteIndex = listVote.findIndex((el) => el.jokeId === jokeId);
    if (voteIndex !== -1) {
      listVote[voteIndex].funny = listVote[voteIndex].funny + 1;
    } else {
      const vote = {
        jokeId: jokeId,
        funny: payload == "funny" ? 1 : 0,
        notFunny: payload == "notFunny" ? 1 : 0,
      };
      listVote.push(vote);
      saveVote(listVote);
    }

    res
      .status(200)
      .send({ message: "Vote successfuly", success: true, data: newData });
  } catch (error) {
    res.status(500).send({ error: error });
  }
});


const port = 5000;

app.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});
module.exports = app;
