const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const bcrypt = require("bcrypt");

const app = express();
app.use(express.json());
const dbPath = path.join(__dirname, "goodreads.db");

let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};
initializeDBAndServer();

// Get Books API
app.get("/books/", async (request, response) => {
  const getBooksQuery = `
  SELECT
    *
  FROM
    book
  ORDER BY
    book_id;`;
  const booksArray = await db.all(getBooksQuery);
  response.send(booksArray);
});

//create User api
app.post("/users/", async (request, response) => {
  const { username, name, password, gender, location } = request.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  const seleectUserQuery = `select * from user where username = '${username}';`;
  const dbuser = await db.get(seleectUserQuery);
  console.log(dbuser);
  if (dbuser === undefined) {
    //create user
    const crateUserQuery = `
      INSERT INTO user(username, name, password, gender, location)
      VALUES(
          '${username}',
          '${name}',
          '${hashedPassword}',
          '${gender}',
          '${location}'
      )`;
    // console.log(crateUserQuery);
    await db.run(crateUserQuery);
    response.send("User crated successfull");
  } else {
    response.status(400);
    response.send("user name already exists");
  }
});

//user login
app.post("/login/", async (request, response) => {
  const { username, password } = request.body;
  const seleectUserQuery = `select * from user where username = '${username}';`;
  const dbuser = await db.get(seleectUserQuery);
  if (dbuser === undefined) {
    //user doesn't exit
    response.status(400);
    response.send("Invalid User");
  } else {
    //compare password,hashed password
    const isPasswordMatch = await bcrypt.compare(password, dbuser.password);
    console.log(isPasswordMatch);
    if (isPasswordMatch) {
      response.send("login successfull");
    } else {
      response.status(400);
      response.send("Invalid Password");
    }
  }
});
