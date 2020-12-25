// server.js
// where your node app starts

// we've started you off with Express (https://expressjs.com/)
// but feel free to use whatever libraries or frameworks you'd like through `package.json`.
const express = require("express");
const bodyParser = require("body-parser");
const fileUpload = require('express-fileupload');
const app = express();
const fs = require('fs');
const db = require("./databaseCache");
const { request, response } = require("express");
const imp = require('./import')


// make all the files in 'public' available
// https://expressjs.com/en/starter/static-files.html
app.use(express.static("public"));

// parse various different custom JSON types as JSON
app.use(bodyParser.json())

// parse some custom thing into a Buffer
app.use(bodyParser.raw())

// parse an HTML body into a string
app.use(bodyParser.text())

// enable files upload
app.use(fileUpload());

/**
 * Gebe einen Tarif durch eingabe der Tarif ID zurück
 * http://localhost:8080/tarif/1
 * 
 * output:
 * [{id, title, zipCode, pricePerUnit, basicPrice, active},...]
 */
app.get("/tarif/:id", (request, response)=> {
  const id = parseInt(request.params.id);
  if(id){
    const tarif = db(`SELECT tp.tarif_plz_id, t.name, tp.fixkosten, tp.variablekosten, tp.aktiv, tp.plz 
    FROM tarif t, tarif_plz tp 
    WHERE t.tarif_id = tp.tarif_id AND tp.tarif_plz_id = ?`).get(id);
    if (tarif){
      response.send({
        "id": tarif.tarif_plz_id,
        "title": tarif.name,
        "zipCode": tarif.plz,
        "pricePerUnit": tarif.variablekosten,
        "basicPrice": tarif.fixkosten,
        "active": tarif.aktiv
      });
    }else{
      response.status(404).send({error:"Not Found"})
    }
  }else{
    response.status(400).send("Bad reqest");
  }
});

/**
 * Gebe alle früheren Versionen des Tarifs zurück
 * Betrachtet werden Preisänderungen, wenn der Tarif unter einem anderen Namen auftritt wird dies nicht beachtet
 * http://localhost:8080/tarif/1/history
 * 
 * output:
 * [{id, title, zipCode, pricePerUnit, basicPrice, active, date},...]
 */
app.get("/tarif/:id/history", (request, response)=>{
  const id = parseInt(request.params.id);
  if(id){
    const tarif = db(`SELECT tp.tarif_id, tp.plz 
    FROM tarif_plz tp 
    WHERE tp.tarif_plz_id = ?`).get(id);
    if (tarif){
      const alleTarife = db(`SELECT tp.tarif_plz_id, t.name, tp.fixkosten, tp.variablekosten, tp.aktiv, tp.plz, tp.datum
      FROM tarif t, tarif_plz tp 
      WHERE tp.tarif_id = t.tarif_id AND tp.plz = ? AND tp.tarif_id = ?`).all(tarif.plz, tarif.tarif_id);
      response.json(alleTarife.map((e)=>{return {
        "id": e.tarif_plz_id,
        "title": e.name,
        "zipCode": e.plz,
        "pricePerUnit": e.variablekosten,
        "basicPrice": e.fixkosten,
        "active": e.aktiv,
        "date": e.datum
      }}));
    }else{
      response.status(404).send({error:"Not Found"})
    }
  }else{
    response.status(400).send("Bad reqest");
  }
});



/**
 * Gibt alle möglichen Tarife und Kosten für die eingegebene PLZ und Verbrauchswert zurück.
 * http://localhost:8080/rates
 * input.body:
 * {zipCode, consumption}
 * 
 * output:
 * [{id, title, zipCode, pricePerUnit, basicPrice, consumption, calculatedPricePerYear},...]
 */
app.get("/rates", (request, response) => {
  const zipIsValide = /^\d{5}$/.test(request.query.zipCode); //5-Stellige PLZ
  const consumptionIsValide = /^\d+([\.,]\d+)?$/.test(request.query.consumption);//int oder fkz[,.]
  const zip = parseInt(request.query.zipCode);
  const consumption = parseFloat(request.query.consumption ?? "".replace(",", "."));
  if (zipIsValide && consumptionIsValide && !isNaN(consumption)) {
    const tarife = db("SELECT tp.tarif_plz_id, t.name, tp.fixkosten, tp.variablekosten FROM tarif t, tarif_plz tp WHERE t.tarif_id = tp.tarif_id and plz = ? AND aktiv = TRUE").all(zip);
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
 * Legt eine Bestellung mit gegeben Daten für einen Tarif an
 * http://localhost:8080/orders
 * input.body:
 * {firstName, lastName, street, streetNumberzipCode, city, rateId, consumption, agent}
 * 
 * output:
 * {id, calculatedPricePerYear}
 */
app.post("/orders", (request, response) => {
  //Prüfung für Valide Werte
  function valideString(input) {
    return typeof (input) == "string" && input != "";
  };
  const zipIsValide = /^\d{5}$/.test(request.body.zipCode); //5-Stellige PLZ
  const consumptionIsValide = /^\d+([\.,]\d+)?$/.test(request.body.consumption);//int oder fkz[,.]
  const rateIdIsValide = /^[0-9]$/.test(request.body.rateId) && db("SELECT * FROM tarif_plz WHERE tarif_plz_id =?").get(request.body.rateId);//:)
  const streetIsValide = valideString(request.body.street);
  const cityIsValide = valideString(request.body.city);
  const firstNameValide = valideString(request.body.firstName);
  const lastNameValide = valideString(request.body.lastName);
  const streetNumber = request.body.streetNumber != "";


  if (zipIsValide && consumptionIsValide && rateIdIsValide && streetIsValide && cityIsValide && firstNameValide && lastNameValide && streetNumber) {
    const result1 = db("SELECT V_ID FROM vergleichsportal WHERE name =?").get(request.body.agent);
    if (result1 === undefined) {
      db("INSERT INTO vergleichsportal (name) VALUES (?)").run(request.body.agent);
    };
    db(
      `INSERT INTO bestellung (tarif_plz_id,v_id,consumption,firstname,lastname,street,streetNumber,zipCode,city,aktiv) 
      VALUES (?,(SELECT v_id FROM vergleichsportal WHERE name=?),?,?,?,?,?,?,?,TRUE)`)
      .run(
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
    const bestellung = db(`SELECT * FROM bestellung 
    WHERE tarif_plz_id = ?
    AND v_id = (SELECT v_id FROM vergleichsportal WHERE name = ?)
    AND consumption = ?
    AND firstname = ?
    AND lastname = ?
    AND street = ?
    AND streetNumber = ?
    AND zipCode = ?
    AND city = ?
    ORDER BY bestell_datum DESC`).get(
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
    const tarif = db(`SELECT * FROM tarif_plz WHERE tarif_plz_id =?`).get(request.body.rateId);
    //Return Statement
    response.status(201).send({
      //Response soll eine Bestellnummer (id), seinen jährlichen Strompreis in EUR (calculatedPricePerYear) enthalten,
      "id": bestellung.bestell_id,
      "calculatedPricePerYear": Math.round(((tarif.fixkosten + tarif.variablekosten * bestellung.consumption) + Number.EPSILON) * 100) / 100
    });

    console.log(db(`SELECT * FROM bestellung where bestell_id=?`).get(bestellung.bestell_id));
  } else {
    response.status(404).send({ error: "bad values" });
  }
});


/**
 * Gibt eine Bestellung mit gegeben Daten für einen Tarif zurück
 * http://localhost:8080/orders/2?zipCode=xxxxx&firstName=xxxxx&lastName=xxxxx
 * 
 * output:
 * {id, tarif, calculatedPricePerYear, aktiv, bestellDatum, firstName, lastName, street, streetnumber, zipCode}
 */
app.get("/orders/:id", (request, response) => {
  const id = parseInt(request.params.id);
  const zip = parseInt(request.query.zipCode);
  const bestellung = db(`SELECT * FROM bestellung 
    WHERE bestell_id = ?
    AND firstname = ?
    AND lastname = ?
    AND zipCode = ?`).get(
    id, //aus URL
    request.query.firstName, //Bestellung
    request.query.lastName, // Bestellung
    zip); //Bestellung
    console.log(bestellung);
  const tarif = db(`SELECT * FROM tarif t, tarif_plz tp where t.tarif_id = tp.tarif_id and tp.tarif_plz_id =?`).get(bestellung.tarif_plz_id);
  if (bestellung == null && tarif == null) {
    response.status(404).send({ error: "Bestellung not found" });
  } else {
    response.status(200).send({
      //Response soll eine Bestellnummer (id), seinen jährlichen Strompreis in EUR (calculatedPricePerYear) enthalten,
      "id": bestellung.bestell_id,
      "tarif": tarif.name,
      "calculatedPricePerYear": Math.round(((tarif.fixkosten + tarif.variablekosten * bestellung.consumption) + Number.EPSILON) * 100) / 100,
      "aktiv": bestellung.aktiv,
      "bestellDatum": bestellung.bestell_datum,
      "firstName": bestellung.firstname,
      "lastName": bestellung.lastName,
      "street": bestellung.street,
      "streetnumber": bestellung.streetnumber,
      "zipCode": bestellung.zipCode
    });
  }
});


/**
 * Löscht die Bestellung die mit den eingegen gegeben Daten übereinstimmt
 * http://localhost:8080/orders/2?zipCode=xxxxx&firstName=xxxxx&lastName=xxxxx
 * 
 * output:
 * String
 */
app.delete("/orders/:id", (request, response) => {
  const id = parseInt(request.params.id);
  const zip = parseInt(request.query.zipCode);
  const bestellung = db(`SELECT * FROM bestellung 
    WHERE bestell_id = ?
    AND firstname = ?
    AND lastname = ?
    AND zipCode = ?`).get(
    id, //aus URL
    request.query.firstName, //Bestellung
    request.query.lastName, // Bestellung
    zip); //Bestellung
  if (bestellung == null) {
    response.status(404).send({ error: "Bestellung not found" });
  } else {
    const storno = db(`SELECT * FROM bestellung WHERE bestell_datum >= date('now','-14 days') AND bestell_id = ?`).all(id);
    if (storno == 0) {
      response.status(404).send({ error: "Bestellung nicht mehr möglich zu stornieren" });
    } else {
      db("Update bestellung SET aktiv= FALSE WHERE bestell_id = ?").run(id);
      response.status(201).send("Bestellung wurde storniert.");
    }
  }
});

/**
 * Rest Schnittstelle zum updaten einer Datei, welche bereits auf dem Server verfügbar ist.
 * body: {path: "path to file"} /default "data.csv"
 * 
 * output:
 * String
 */
app.post("/update", (request, response) => {
  const importer = new imp();
  importer.importData(path = request.body.path ?? undefined, callback = (error = false) => {
    if (error)
      response.status(500).send("Server error");
    else 
      response.send("DONE");
  });
});


/**
 * Rest-Schnittstelle zum updaten der Datenbank
 * den Inhalt der CSV als text im Body mit einem POST an /update senden
 * 
 * output:
 * String
 */
app.post("/update/text", (request, response) => {
  const importer = new imp();
  console.log(request);
  if (typeof(request.body) == "string"){
    //muss noch auf string
    importer.importString(input = request.body, callback = (error = false) => {
      if (error === true)
        response.status(500).send("Server error");
      else 
        response.send("DONE");
    });
  }else{
    response.status(400).send("String as body required");
  }
});

/**
 * Restschnittstelle zum Updaten der Datenbank mittels Dateiuploads, als formdata
 * der Key, en dem sich die Datei befindet ist frei oder mehrfach wählbar. Es darf nur eine Datei pro Key gewählt werden.
 * 
 * output:
 * string
 */
app.post("/update/file", (request, response) => {
  const importer = new imp();
  if(!request.files) {
    response.status(400).send('No file uploaded');
  } else {
    for (let key in request.files){
      console.log(`Try to import ${request.files[key].name}`);
      importer.importString(input = request.files[key].data.toString("ascii"), callback = (error = false) => {
        if (error === true)
          response.status(500).send("Server error");
        else 
          response.send("DONE");
      });
      console.log();
    }
  }
});


/** Alle anderen Pfade auf /views umleiten, damit HTML Websiten möglich sind.
 *  Es müssen alle speziellen Handler vor diesem Punkt definiert werden, alles unterhalb wird ignoriert
 *  Die Struktur entspricht dabei dem weglassen von /views
 *  Bsp.: Anfrage /index.html Antwort: ./views/index.html
 *  Rückgabe von 404 wenn nicht vorhanden
*/
app.get("/:path*", (request, response) => {
  console.log(request.path);
  if (fs.existsSync(__dirname + "/views" + request.path)) {
    response.sendFile(__dirname + "/views" + request.path);
  } else {
    response.status(404).send("404 Not Found");
  }
});
app.get("*:path/", (request, response) => {
  console.log(request.path);
  if (fs.existsSync(__dirname + "/views" + request.path + "/index.html")) {
    response.sendFile(__dirname + "/views" + request.path + "/index.html");
  } else {
    response.status(404).send("404 Not Found");
  }
});
app.get("/", (request, response) => {
  console.log(request.path);
  if (fs.existsSync(__dirname + "/views/index.html")) {
    response.sendFile(__dirname + "/views/index.html");
  } else {
    response.status(404).send("404 Not Found");
  }
});

/** 
 * Starten des Severs
*/
const listener = app.listen(8080, () => {
  console.log("Your app is listening on port " + listener.address().port);
});