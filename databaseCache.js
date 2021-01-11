/**
 * Mapt Better SQLite3.prepare auf ein Modul, welches die Preparierten Statements zwischenspeichert und bei Bedarf zurückgibt.
 * @module databaseCache
 * @see module:BetterSqlite3
 */

 /** Datenbankverbindung aus database.js*/
const db = require("./database")();
/** Benötigt zum Berechnen von Hash-Werten */
const crypto = require("crypto");
  
const statements= {};

/**
 * Stelle eine Funktion bereit, welche SQL-Statements automatisch kompiliert und diese bei erneutem Eintreten aus dem Speicher entnimmt.
 * Somit ist das Kompilieren nur einmal pro Serverstart notwendig.
 * @param {String} sql Statement
 * @return {BetterSqlite3.prepare} BetterSQLite3 statement
 * @see BetterSQLite3.prepare
 */
module.exports = function (sql) {
    const hash = crypto
        .createHash("sha256")
        .update(sql)
        .digest("hex");
    return statements[hash] || (() => {
        console.log('Preparing: '+ hash);
        const s = db.prepare(sql);
        statements[hash]= s;
        return s;
    })();
};