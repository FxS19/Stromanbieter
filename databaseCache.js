
const db = require("./database")();
const crypto = require("crypto");
  
const statements= {};
/**
    Stelle ein Interface bereit, welches SQL-befehle automatisch vorde
    @param sql String
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