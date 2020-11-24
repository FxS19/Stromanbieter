// server.js
// where your node app starts

// we've started you off with Express (https://expressjs.com/)
// but feel free to use whatever libraries or frameworks you'd like through `package.json`.
const express = require("express");
const bodyParser = require("body-parser");
const { request, response } = require("express");
const app = express();
const fs = require('fs');

const importer = require("./import");
importer.importData();

const provideDatabase = require('./database');
const parse = require("csv-parse");
const database = provideDatabase();

// make all the files in 'public' available
// https://expressjs.com/en/starter/static-files.html
app.use(express.static("public"));

app.use(bodyParser.json())

/**
 * Schnittstelle für /rates
 * input:
 * zipCode, consumption
 * 
 * output:
 * [{id, title, zipCode, pricePerUnit, basicPrice, consumption, calculatedPricePerYear}, ...]
 */
app.get("/rates", async (request, response) => {
  const zipIsValide = /^\d{5}$/.test(request.query.zipCode); //5-Stellige PLZ
  const consumptionIsValide = /^\d+([\.,]\d+)?$/.test(request.query.consumption);//int oder fkz[,.]
  const zip = parseInt(request.query.zipCode);
  const consumption = parseFloat(request.query.consumption ?? "".replace(",", "."));
  if (zipIsValide && consumptionIsValide && !isNaN(consumption)) {
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
        "calculatedPricePerYear": Math.round(((tarif.fixkosten + tarif.variablekosten * consumption) + Number.EPSILON) * 100) / 100,
      };
    });
    calc = calc.sort((lhs, rhs) => lhs.calculatedPricePerYear - rhs.calculatedPricePerYear);
    response.json(calc);
  } else {
    response.status(404).send({ error: "bad values" });
  }
});



/**
 * Irmas Bestellung Schnittstelle
 */
/**
 * /orders um Bestellungen anzulegen
 */
app.post("/orders", async (request, response) => {
  const db = await database;

  //Prüfung für Valide Werte
  function valideString(input) {
    return typeof (input) == "string" && input != "";
  };
  const zipIsValide = /^\d{5}$/.test(request.body.zipCode); //5-Stellige PLZ
  const consumptionIsValide = /^\d+([\.,]\d+)?$/.test(request.body.consumption);//int oder fkz[,.]
  const rateIdIsValide = /^[0-9]$/.test(request.body.rateId) && await db.get("SELECT * FROM tarif_plz WHERE tarif_plz_id =?", request.body.rateId);//:)
  const streetIsValide = valideString(request.body.street);
  const cityIsValide = valideString(request.body.city);
  const firstNameValide = valideString(request.body.firstName);
  const lastNameValide = valideString(request.body.lastName);
  const streetNumber = request.body.streetNumber != "";


  if (zipIsValide && consumptionIsValide && rateIdIsValide && streetIsValide && cityIsValide && firstNameValide && lastNameValide && streetNumber) {
    const result1 = await db.get("SELECT V_ID FROM vergleichsportal WHERE name =?", request.body.agent);
    if (result1 === undefined) {
      const create_agent = await db.run(
        "INSERT INTO vergleichsportal (name) VALUES (?)", request.body.agent);
    };
    const create_order = await db.run(
      `INSERT INTO bestellung (tarif_plz_id,v_id,consumption,firstname,lastname,street,streetNumber,zipCode,city,aktiv) 
    VALUES (?,(SELECT v_id FROM vergleichsportal WHERE name=?),?,?,?,?,?,?,?,TRUE)`,
      request.body.rateId, // Bestellung - Tarif_PLZ_ID
      request.body.agent, //Vergleichsportal
      request.body.consumption,//Bestellung);
      request.body.firstName, //Bestellung
      request.body.lastName, // Bestellung
      request.body.street, //Bestellung
      request.body.streetNumber, //Bestellung
      request.body.zipCode, // Bestellung
      request.body.city); //Bestellung - Stadt

    //Return Select Bestellung Info
    const bestellung = await db.get(`SELECT * FROM bestellung 
    WHERE tarif_plz_id = ?
    AND v_id = (SELECT v_id FROM vergleichsportal WHERE name = ?)
    AND consumption = ?
    AND firstname = ?
    AND lastname = ?
    AND street = ?
    AND streetNumber = ?
    AND zipCode = ?
    AND city = ?
    ORDER BY bestell_datum DESC`,
      request.body.rateId, // Bestellung - Tarif_PLZ_ID
      request.body.agent, //Vergleichsportal
      request.body.consumption,//Bestellung);
      request.body.firstName, //Bestellung
      request.body.lastName, // Bestellung
      request.body.street, //Bestellung
      request.body.streetNumber, //Bestellung
      request.body.zipCode, // Bestellung
      request.body.city); //Bestellung - Stadt
    //Return Select Tarif Info
    const tarif = await db.get(`SELECT * FROM tarif_plz WHERE tarif_plz_id =?`, request.body.rateId);
    //Return Statement
    response.status(201).send({
      //Response soll eine Bestellnummer (id), seinen jährlichen Strompreis in EUR (calculatedPricePerYear) enthalten,
      "id": bestellung.bestell_id,
      "calculatedPricePerYear": Math.round(((tarif.fixkosten + tarif.variablekosten * bestellung.consumption) + Number.EPSILON) * 100) / 100
    });

    console.log(await db.get(`SELECT * FROM bestellung where bestell_id=?`, bestellung.bestell_id));
  } else {
    response.status(404).send({ error: "bad values" });
  }
});
/**
 * /orders/ um Bestellungen anzusehen?
 */

/**
* /orders/ um Bestellungen zu Stornieren?
*/
/*

*/
/**
 * 
 */
app.post("/update", async (request, response) => {
  importer.importData(path = request.body.path ?? undefined, callback = (error = false) => {
    if (error)
      response.status(500).send("Server error");
    else 
      response.send("DONE");
  });
});

// Alle anderen Pfade auf /views umleiten, damit HTML Websiten möglich sind.
// Es müssen alle speziellen Handler vor diesem Punkt definiert werden, alles unterhalb wird ignoriert
// Die Struktur entspricht dabei dem weglassen von /views
// Bsp.: Anfrage /index.html Antwort: ./views/index.html
// Rückgabe von 404 wenn nicht vorhanden
// https://expressjs.com/en/starter/basic-routing.html
app.get("/:path*", (request, response) => {
  console.log(request.path);
  if(fs.existsSync(__dirname + "/views" + request.path)){
  response.sendFile(__dirname + "/views" + request.path);
  }else{
    response.status(404).send("404 Not Found");
  }
});
// https://expressjs.com/en/starter/basic-routing.html
app.get("*:path/", (request, response) => {
  console.log(request.path);
  if(fs.existsSync(__dirname + "/views" + request.path + "/index.html"))
  {
    response.sendFile(__dirname + "/views" + request.path + "/index.html");
  }else{
    response.status(404).send("404 Not Found");
  }
});

// listen for requests :)
const listener = app.listen(8080, () => {
  console.log("Your app is listening on port " + listener.address().port);
});