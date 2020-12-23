
const db = require("./database")();
const crypto = require("crypto");
  
const statements= {};

/**
 *  Stelle eine Funktion bereit, welche SQL-Statements automatisch kompiliert und diese bei erneutem Eintreten aus dem Speicher entnimmt.
 *  Somit ist das Kompilieren nur einmal pro Serverstart notwendig.
 *  @param sql String
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