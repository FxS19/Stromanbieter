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
app.get("/", (request, response) => {
  response.sendFile(__dirname + "/views/index.html");
});

/**
 * Schnittstelle für /rates
 */
app.get("/rates", async (request, response) => {
  console.log("/rates");
  const zipIsValide = /^\d{5}$/.test(request.query.zipCode); //5-Stellige PLZ
  const consumptionIsValide = /^\d+([\.,]\d+)?$/.test(request.query.consumption);//int oder fkz[,.]
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


/**
* Irmas Bestellung Schnittstelle
*/ 

app.post("/orders", async (request, response) => {
  const db = await database;
  //Prüfung für Valide Werte
  const zipIsValide = /^\d{5}$/.test(request.body.zipCode); //5-Stellige PLZ
  const consumptionIsValide = /^\d+([\.,]\d+)?$/.test(request.body.consumption);//int oder fkz[,.]
  const rateIdIsValide = /^[0-9]$/.test(request.body.rateId) && await db.get("SELECT * FROM tarif_plz WHERE tarif_plz_id =?", request.body.rateId);//:)
  
  function valideString(input){
    return typeof(input) == "string" && input != "";
  };

  const streetIsValide = valideString(request.body.street);
  const cityIsValide = valideString(request.body.city);
  const firstNameValide= valideString(request.body.firstName);
  const lastNameValide= valideString(request.body.lastName);
  const streetNumber = request.body.streetNumber != "";
  
  if (zipIsValide && consumptionIsValide && rateIdIsValide && streetIsValide && cityIsValide && firstNameValide && lastNameValide && streetNumber){
    const result1 = await db.get("SELECT V_ID FROM vergleichsportal WHERE name =?", request.body.agent);
    if (result1 === undefined){
      //Insert in Vergleichportal
      const created = await db.run( 
      "INSERT INTO vergleichsportal (name) VALUES (?)",request.body.agent);
      // Insert in Bestellung
    };
      const created = await db.run( 
      `INSERT INTO bestellung (tarif_plz_id,v_id,consumption,firstname,lastname,street,streetNumber,zipCode,city) 
      VALUES (?,(SELECT v_id FROM vergleichsportal WHERE name=?),?,?,?,?,?,?,?)`,
      request.body.rateId, // Bestellung - Tarif_PLZ_ID
      request.body.agent, //Vergleichsportal
      request.body.consumption,)//Bestellung);
      request.body.firstName, //Bestellung
      request.body.lastName, // Bestellung
      request.body.street, //Bestellung
      request.body.streetNumber, //Bestellung
      request.body.zipCode, // Bestellung
      request.body.city //Bestellung - Stadt
    
    response.status(201).send({
      //Response soll eine Bestellnummer (id), seinen jährlichen Strompreis in EUR (calculatedPricePerYear) enthalten,
    });
  }else{
    response.status(404).send({error: "bad values"});
  }
});
/*

*/
/********/
// listen for requests :)
const listener = app.listen(8080, () => {
  console.log("Your app is listening on port " + listener.address().port);
});