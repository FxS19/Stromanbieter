// server.js
// where your node app starts

// we've started you off with Express (https://expressjs.com/)
// but feel free to use whatever libraries or frameworks you'd like through `package.json`.
const express = require("express");
const bodyParser = require("body-parser");
const { request } = require("express");
const app = express();

const importer =require("./import");
importer.importData();

const provideDatabase = require('./database');
const database = provideDatabase();

// make all the files in 'public' available
// https://expressjs.com/en/starter/static-files.html
app.use(express.static("public"));

app.use(bodyParser.json())

// https://expressjs.com/en/starter/basic-routing.html
/*app.get("/", (request, response) => {
  response.sendFile(__dirname + "/views/index.html");
});*/


// listen for requests :)
const listener = app.listen(8080, () => {
  console.log("Your app is listening on port " + listener.address().port);
});