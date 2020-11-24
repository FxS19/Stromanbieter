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
    static importData(path = "./data.csv", callback = (error)=>{if (error) console.log("Nothing to update")}) {
      if (fs.existsSync(path)){
        const startTime = new Date();
        try {
          this.loadCSV(async (data) => {
            try {
              await Importer.importTarifnamen(data);
              await Importer.importTarife(data);
              const seconds = Math.round((new Date() - startTime)/100)/10;
              console.info(`import done after ${seconds} seconds`);
              fs.renameSync(path, "./data.old");
              callback();
            } catch (error) {
              callback(true);
            }
          }, path);
        } catch (error) {
          callback(true);
        }
      }else{
        callback(true)
      };
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
     * @param {String} path
     */
    static loadCSV(callback, path) {
        const csvData = [];
        fs.createReadStream(path) 
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
            columns: (names) => names.map((name) => name.toLowerCase()) })
          )
          .on('data', function (csvrow) {
            //console.log(csvrow);
            //do something with csvrow
            csvData.push(csvrow);
          })
          .on('end', function () {
            //do something with csvData
            callback(csvData);
          })
          .on('error', (error) => {
            
            console.warn(error);
            callback(true);
          });
    }
  
  /**
  * Lese vorhandenen Tarife aus dem csv import
  * Falls es neue Tarife gibt, werden diese in die Datenbank importiert
  * @param  {Array} data
  */
  static async importTarife(data){
    let samectr = 0;
    let doublectr = 0;
    let newctr = 0;
    const db = await database;

    //Alle Tarife deaktivieren
    await db.run(`
      UPDATE tarif_plz
      SET aktiv = FALSE 
      WHERE aktiv = TRUE;
    `);
    console.info(`Updating database with ${data.length} values!`);

    for (let i = 0; i < data.length; i++) {
      if ( i % (Math.floor(data.length/10)) == 0) console.log(Math.round((i/data.length)*100) + "%"); 
      const element = data[i];
      //Der Tarif muss schon genau so gespeichert sein und er muss der Aktuellste der jewiligen plz/namen kombination sein
      const tarifExists = await db.get(`
        SELECT tarif_plz_id, aktiv 
        FROM tarif_plz 
        INNER JOIN tarif 
          ON tarif_plz.tarif_id = tarif.tarif_id 
        WHERE name = ? 
        AND plz = ? 
        AND fixkosten = ? 
        AND variablekosten = ?
        AND datum = (
          SELECT MAX(datum) FROM tarif_plz
          INNER JOIN tarif 
            ON tarif_plz.tarif_id = tarif.tarif_id 
          WHERE name = ? 
          AND plz = ?);`
        , element.tarifname, element.plz, element.fixkosten, element.variablekosten, element.tarifname, element.plz);

      if (tarifExists !== undefined){
        if (tarifExists.aktiv){//Ist der Tarif schon aktiv? kann nur sein, wenn er doppelt vorkommt
          doublectr++;
        } else{
          db.run(`
            UPDATE tarif_plz
            SET aktiv = TRUE
            WHERE tarif_plz_id = ?;
          `, tarifExists.tarif_plz_id);
          samectr++;
        }
      }else{
        db.run(`
          INSERT INTO tarif_plz (tarif_id,plz,fixkosten,variablekosten,aktiv)
          VALUES ((SELECT tarif_id FROM tarif where name = ?),?,?,?,TRUE)`
          ,element.tarifname,element.plz,element.fixkosten,element.variablekosten);
        newctr++;
      }
    }
    console.info(`-----------\nNew: ${newctr}\nSame: ${samectr}\nDouble: ${doublectr}\n-----------`);
  }
}

module.exports = Importer
