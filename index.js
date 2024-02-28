import express from "express";
import bodyParser from "body-parser";
import pg from "pg";
import bcrypt from "bcrypt";
import env from "dotenv";

const app = express();
const port = 3000;
const saltrounds = 10;
let quizCounter = 0;
var title = [];
var questions = [];

env.config();
const db = new pg.Client({
  user: process.env.PG_USER,
  host: process.env.PG_HOST,
  database: process.env.PG_DATABASE,
  password: process.env.PG_PASSWORD,
  port: process.env.PG_PORT,
});
db.connect();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

app.get("/", (req, res) => {
  res.render("home.ejs");
});
app.get("/create", (req, res) => {
  try{
  res.render("create.ejs");}
  catch(err){
    console.log(err);
  }
})
app.get("/login", (req, res) => {
  res.render("login.ejs");
});

app.get("/register", (req, res) => {
  res.render("register.ejs");
});
app.post("/register", async (req, res) => {
  const email = req.body.username;
  const password = req.body.password;

  try {
    const checkResult = await db.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);

    if (checkResult.rows.length > 0) {
      res.send("Email already exists. Try logging in.");
    } else {
      // password hashing
      bcrypt.hash(password, saltrounds, async (err,hash) => {
        if (err){
          console.log("error detected");
        }else{
        const result = await db.query(
          "INSERT INTO users (email, password) VALUES ($1, $2)",
          [email, hash]
        );
        console.log(result);
        res.render("main.ejs");
      }
      })
    }
  } catch (err) {
    console.log(err);
  }
});
app.post("/login", async (req, res) => {
  const email = req.body.username;
  const loginpassword = req.body.password;

  try {
    const result = await db.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);
    if (result.rows.length > 0) {
      const user = result.rows[0];
      const storedhashedPassword = user.password;
      bcrypt.compare(loginpassword,storedhashedPassword, (err,result) => {
        if (err){
          console.log("error occured");
        }else{
          if (result){
            res.render("main.ejs");
          }else{
            res.send("Incorrect Password");
          }
        }

      })}else{
        res.send("User not found!");
      }
    } catch (err) {
    console.log(err);
  }
});
app.post("/quiz", (req,res) => {
  quizCounter+=1;
  var currentitle = req.body.title;
  title.push(currentitle)
  questions.push([
    {
      question: req.body.question1,
      answers: [
          {text:req.body.answer1, correct: req.body.A1},
          {text:req.body.answer1, correct: req.body.B1},
          {text:req.body.answer1, correct: req.body.C1},
          {text:req.body.answer1, correct: req.body.D1},
      ]
    },
  ]);
console.log(title);

 res.render("main.ejs", { title: title});
})
app.post("/question", (req,res) => {
  res.render("question.ejs", {questions: questions})
  console.log(questions);
})
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
