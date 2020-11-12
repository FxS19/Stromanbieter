const { request } = require("express");

const sqlite3 = require('sqlite3');
const sqlite = require('sqlite');
const fs = require('fs');

/**
 * Bereite die Datenbank zum verwenden vor
 * Falls noch keine Datenbank vorhanden ist wird diese in ./.data/database.db erstellt.
 * @return {Database} database object
 */
async function provideDatabase() {
      const databaseExists = fs.existsSync('./.data/database.db');
      const db = await sqlite.open({
            filename: './.data/database.db',
            driver: sqlite3.Database
      });

      if (!databaseExists) {
            //Tabellen erstellen
            //rm .data/* <--alle Dateien in .data löschen (reset)
            await db.exec(`CREATE TABLE vergleichsportal (
          v_id INTEGER PRIMARY KEY AUTOINCREMENT, 
          name STRING, 
          provision FLOAT)`);
          //done
          /*  await db.exec(`CREATE TABLE plz (
          plz INTEGER PRIMARY KEY)`); Unnötig*/
          //done
            await db.exec(`CREATE TABLE tarif (
          tarif_id INTEGER PRIMARY KEY AUTOINCREMENT, 
          name VARCHAR, 
          datum DATETIME DEFAULT CURRENT_TIMESTAMP)`);
            await db.exec(`CREATE TABLE tarif_plz (
          tarif_plz_id INTEGER PRIMARY KEY AUTOINCREMENT, 
          tarif_id INTEGER, 
          plz INTEGER, 
          fixkosten FLOAT, 
          variablekosten FLOAT, 
          aktiv BOOLEAN)`);
            await db.exec(`CREATE TABLE bestellung (
          bestell_id INTEGER PRIMARY KEY AUTOINCREMENT, 
          tarif_plz_id INTEGER, 
          v_id INTEGER,
          consumption INTEGER,
          firstname STRING,
          lastname STRING,
          street STRING, 
          streetnumber INTEGER, 
          zipCode INTEGER,
          city STRING
          bestell_datum DATETIME DEFAULT CURRENT_TIMESTAMP)`);
      }
      return db;
}


module.exports = provideDatabase;