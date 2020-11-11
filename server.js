// server.js
// where your node app starts

// we've started you off with Express (https://expressjs.com/)
// but feel free to use whatever libraries or frameworks you'd like through `package.json`.
const express = require("express");
const bodyParser = require("body-parser");
const { request } = require("express");
const app = express();

const importer =require("./import");
//importer.importData();

const provideDatabase = require('./database');
const parse = require("csv-parse");
const database = provideDatabase();

// make all the files in 'public' available
// https://expressjs.com/en/starter/static-files.html
app.use(express.static("public"));

app.use(bodyParser.json())

// https://expressjs.com/en/starter/basic-routing.html
/*app.get("/", (request, response) => {
  response.sendFile(__dirname + "/views/index.html");
});*/

/**
 * Schnittstelle für /rates
 */
app.get("/rates", async (request, response) => {
  const zipIsValide = /^\d{5}$/.test(request.query.zipCode); //5-Stellige PLZ
  const consumptionIsValide = /^[0-9,\.]+$/.test(request.query.consumption);//Zahl, fkz[,.]
  const zip = parseInt(request.query.zipCode);
  const consumption = parseFloat(request.query.consumption.replace(",", "."));
  if (zipIsValide && consumptionIsValide && !isNaN(consumption)){
    const db = await database;
    const tarife = await db.all("SELECT tp.tarif_plz_id, t.name, tp.fixkosten, tp.variablekosten FROM tarif t, tarif_plz tp WHERE t.tarif_id = tp.tarif_id and plz = ?", zip);
    let calc = tarife.map((tarif) => {
      return {
        "id": tarif.tarif_plz_id,
        "title": tarif.name,
        "zipCode": request.query.zipCode,
        "pricePerUnit": tarif.variablekosten,
        "basicPrice": tarif.fixkosten,
        "consumption": consumption,
        "calculatedPricePerYear": tarif.fixkosten + tarif.variablekosten * consumption,
      };
    });
    calc = calc.sort((lhs, rhs) => lhs.calculatedPricePerYear - rhs.calculatedPricePerYear);
    response.json(calc);
  }else{
    response.status(404).send({error: "bad values"});
  }
});

// listen for requests :)
const listener = app.listen(8080, () => {
  console.log("Your app is listening on port " + listener.address().port);
});