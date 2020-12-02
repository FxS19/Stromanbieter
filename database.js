const fs = require('fs');

/**
 * Bereite die Datenbank zum verwenden vor
 * Falls noch keine Datenbank vorhanden ist wird diese in ./.data/database.db erstellt.
 * @return {BetterSqlite3.Database}
 */
module.exports = function provideDatabase() {
  const databaseExists = fs.existsSync('./.data/database.db');
  /**
   * Benutzen von Better-sqlite3
   * Bietet eine einheitlichere Schnittstelle zu JS.
   * zudem ist Vorkompilieren von Querries möglich, sowie das schreiben von aggregaten.
   * Mehr Informationen unter: https://github.com/JoshuaWise/better-sqlite3/blob/HEAD/docs/api.md
  */
  const db = require('better-sqlite3')('./.data/database.db'/*, { verbose: console.log }*/);

  if (!databaseExists) {
    //Tabellen erstellen
    //rm .data/* <--alle Dateien in .data löschen (reset)
    db.exec(`CREATE TABLE vergleichsportal (
      v_id INTEGER PRIMARY KEY AUTOINCREMENT, 
      name STRING, 
      provision FLOAT)`);
    db.exec(`CREATE TABLE tarif (
      tarif_id INTEGER PRIMARY KEY AUTOINCREMENT, 
      name VARCHAR)`);
      
    db.exec(`CREATE TABLE tarif_plz (
      tarif_plz_id INTEGER PRIMARY KEY AUTOINCREMENT,
      tarif_id INTEGER KEY, 
      plz INTEGER, 
      fixkosten FLOAT,
      variablekosten FLOAT,
      aktiv BOOLEAN DEFAULT TRUE,
      datum DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(tarif_id) REFERENCES tarif(tarif_id))`);
    db.exec(`CREATE TABLE bestellung (
      bestell_id INTEGER PRIMARY KEY AUTOINCREMENT, 
      tarif_plz_id INTEGER, 
      v_id INTEGER,
      consumption INTEGER,
      firstname STRING,
      lastname STRING,
      street STRING, 
      streetnumber INTEGER, 
      zipCode INTEGER,
      city STRING,
      bestell_datum DATETIME DEFAULT CURRENT_TIMESTAMP,
      aktiv BOOLEAN)`);
  }
  return db;
}