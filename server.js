// server.js
// where your node app starts

// we've started you off with Express (https://expressjs.com/)
// but feel free to use whatever libraries or frameworks you'd like through `package.json`.
const express = require("express");
const bodyParser = require("body-parser");
const app = express();
let cakes = require ("./cakes");

// make all the files in 'public' available
// https://expressjs.com/en/starter/static-files.html
app.use(express.static("public"));

app.use(bodyParser.json())

// https://expressjs.com/en/starter/basic-routing.html
app.get("/", (request, response) => {
  response.sendFile(__dirname + "/views/index.html");
});

// https://expressjs.com/en/starter/basic-routing.html
app.get("/cakes", (request, response) => {
  response.json(cakes);
});

// https://expressjs.com/en/starter/basic-routing.html
app.get("/cakes/:id", (request, response) => {
  console.log(request.params);
  let mycake = cakes.find(element => element.id == parseInt(request.params.id));
  if (mycake != null) {
    response.json(mycake);
  }else{
    response.status(404).send({error: "Not found"});
  }
});

app.post('/cakes',  (request, response) => {
    console.log(request.body);
    try {
      const cake = {
        id: Math.max(...cakes.map(element => element.id))+1,
        name: request.body.name,
        weight: request.body.weight,
        uom: request.body.uom
      }
      cakes.push(cake);
      response.json(cake);
    } catch (error) {
      response.status("400").send({error: "Wrong message"});
    }
});



// listen for requests :)
const listener = app.listen(8080, () => {
  console.log("Your app is listening on port " + listener.address().port);
});