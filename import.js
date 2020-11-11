/**
 * Diese Datei beinhaltet Funktionen zum Importieren einer CSV Datei in die Datenbank
*/
const parse = require('csv-parse');
const fs = require('fs');

const provideDatabase = require('./database');
const database = provideDatabase();

class Importer {
    /**
     * Einstiegsfunktion zum einlesen der csv und updaten der Datenbank
     */
    static importData() {
        this.loadCSV(this.parseData);
    }

    /**
     * Diese Funktion wird als Callback von importData aufgerufen.
     * @param  {object} data
     */
    static async parseData(data) {
        //console.log(data);
        await Importer.importTarifnamen(data);
        await Importer.importTarife(data);
        //await Importer.importPLZ(data);
    }

    /**
     * Lese vorhandenen Tarife aus dem csv import
     * Falls es neue Tarife gibt, werden diese in die Datenbank importiert
     * @param  {Array} data
     */
    static async importTarifnamen(data) {
        const tarife = data.map((value) => value.tarifname).filter((v, i, a) => a.indexOf(v) === i);
        const db = await database;
        for (let i = 0; i < tarife.length; i++) {
            const name = tarife[i];
            const result = await db.get("SELECT * FROM tarif WHERE name = ?", name);
            if (result === undefined) {
                console.log("Inserting Tarif " + name);
                await db.run("INSERT INTO tarif (name) VALUES (?)", name);
            }
        }
        //console.log(await db.all("SELECT * FROM tarif"));
    }

    /**
     * Lade data.csv und gebe die gelesenen Daten an die callbackfunktion weiter
     * @param  {function} callback
     */
    static loadCSV(callback) {
        const csvData = [];
        fs.createReadStream('data.csv') 
            .pipe(parse({
                delimiter: ';',
                cast: (value) => {
                    const isInt = parseInt(value);
                    if (!isNaN(isInt) && !value.search(",")){
                        return isInt;
                    }
                    const isFloat = parseFloat(value.replace(",","."));
                    if(!isNaN(isFloat)){
                        return isFloat;
                    }
                    return value;
                },
                columns: (names) => names.map((name) => name.toLowerCase()) }))
            .on('data', function (csvrow) {
                //console.log(csvrow);
                //do something with csvrow
                csvData.push(csvrow);
            })
            .on('end', function () {
                //do something with csvData
                callback(csvData);
            });
    }
  
  /**
  * Lese vorhandenen Tarife aus dem csv import
  * Falls es neue Tarife gibt, werden diese in die Datenbank importiert
  * @param  {Array} data
  */
  static async importTarife(data){ 
    const db = await database;
    for (let i = 0; i < 1; /*data.length;*/ i++) {  
      const element = data[i];
      //gibt es den Tarif so genau schon
      const res = await db.get(`SELECT tp.tarif_plz_id FROM tarif_plz tp, tarif t
                                WHERE tp.plz = ?
                                AND t.tarif_id = tp.tarif_id
                                AND t.name = ?
                                AND tp.aktiv = TRUE;`
                               , element.plz, element.tarifname);

      console.log("1. Select:");
      console.log(res);
      if (res === undefined){
        //console.log("IS UNDEFINED");
        await db.run(`INSERT INTO tarif_plz (tarif_id,plz,fixkosten,variablekosten,aktiv)
                      SELECT tarif_id ,?,?,?,TRUE
                      FROM tarif where name =?`
                     ,element.plz,element.fixkosten,element.variablekosten,element.tarifname);
        console.log("Insert");   
      } else {
        //console.log("IS DEFINED, 2. Select:");
        const res = await db.get(`SELECT tp.tarif_plz_id FROM tarif_plz tp, tarif t
                                WHERE tp.plz = ?
                                AND t.tarif_id = tp.tarif_id
                                AND t.name = ?
                                AND tp.aktiv = TRUE
                                AND tp.fixkosten = ?
                                AND tp.variablekosten = ?;`
                               , element.plz, element.tarifname, element.fixkosten, element.variablekosten);  
        //console.log(res);
         
        if (res === undefined){
          //console.log("2. IS Undefined:");
          // alten auf inaktiv setzten -> alter table where tarif_plz_id = ? 
          await db.run(`UPDATE tarif_plz SET aktiv = FALSE 
                                WHERE plz = ?
                                AND (SELECT tarif_id FROM tarif WHERE name = ?)
                                AND aktiv = true;`
                               , element.plz, element.tarifname);
          await db.run(`INSERT INTO tarif_plz (tarif_id,plz,fixkosten,variablekosten,aktiv)
                        VALUES ((SELECT tarif_id FROM tarif where name =?),?,?,?,TRUE)`
                       ,element.tarifname,element.plz,element.fixkosten,element.variablekosten);
        } else {
          console.log("Nix passiert, da Daten gleich.");
          console.log(await db.all("SELECT * FROM tarif_plz WHERE tarif_id = 1"));    
        }
      }
    }

  }
  /* 
  Tarif_id = 1 und PLZ= 74564 da?
  nein => inserten
ja => auch fixkosten und variable kosten gleich?
  ja => nixt tun
  nein => alten wert auf inaktiv, neuen inserten

  */

}

module.exports = Importer
