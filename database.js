const { request } = require("express");

const sqlite3 = require('sqlite3');
const sqlite = require('sqlite');
const csv = require('csv-parser')
const fs = require('fs');

async function provideDatabase(){
    const databaseExists = fs.existsSync('./.data/database.db');
    const db = await sqlite.open({
        filename: './.data/database.db',
        driver: sqlite3.Database
    });

    if (!databaseExists){
      //Tabellen erstellen
      //rm .data/* <--alle Dateien in .data löschen (reset)
      await db.exec("CREATE TABLE kunden (k_id INTEGER PRIMARY KEY AUTOINCREMENT, name STRING, geburtsdatum DATE)");
      await db.exec("CREATE TABLE vergleichsportal (v_id INTEGER PRIMARY KEY AUTOINCREMENT, name STRING, provision FLOAT)");
      await db.exec("CREATE TABLE plz (plz INTEGER PRIMARY KEY AUTOINCREMENT)");
      await db.exec("CREATE TABLE tarif (tarif_id INTEGER PRIMARY KEY AUTOINCREMENT, name VARCHAR, datum DATETIME DEFAULT CURRENT_TIMESTAMP)");
      await db.exec("CREATE TABLE tarif_plz (tarif_plz_id INTEGER PRIMARY KEY AUTOINCREMENT, tarif_ID INTEGER FOREIGN KEY REFERENCES tarif(tarif_id), plz INTEGER FOREIGN KEY REFERENCES plz(plz), fixkosten FLOAT, variablekosten FLOAT), aktiv BOOLEAN");
      await db.exec("CREATE TABLE bestellung (bestell_id INTEGER PRIMARY KEY AUTOINCREMENT, tarif_plz_id INTEGER FOREIGN KEY REFERENCES tarif_plz(tarif_plz_id), k_id INTEGER FOREIGN KEY REFERENCES kunden(k_id), v_id INTEGER FOREIGN KEY PREFERENCES vergleichsportal(v_id), strasse STRING, hausnummer INTEGER, beginn DATE, bestell_datum DATETIME DEFAULT CURRENT_TIMESTAMP");
    }
    return db;
}

function loadCSV(){
  //CSV parsen und in results ablegen
const results = [];
fs.createReadStream('data.csv')
  .pipe(csv({
    mapHeaders: ({header, index}) => header.toLowerCase(),
    separator:";"
  }))
  .on('data', (data) => results.push(data))
  .on('end', () => {
    console.log(results);
  });
  return results;
}

module.exports = provideDatabase;