/**
 * Diese Datei beinhaltet Funktionen zum Importieren einer CSV Datei in die Datenbank
 */
const { Parser } = require('csv-parse');
const parse = require('csv-parse');
const fs = require('fs');
const { Readable } = require("stream");

const provideDatabase = require('./database');
const db = provideDatabase();

/**
 * Klasse zum Importieren von Daten aus einer CSV
 * Alle Member sind static
 */
class Importer {
    /**
     * Einstiegsfunktion zum Einlesen der csv und Updaten der Datenbank
     * @param {String} path 
     * @param {Function} callback 
     */
    static importData(path = "./data.csv", callback = (error)=>{if (error) console.log(error)}) {
      if (fs.existsSync(path)){
        try {
          this.loadCSV(async (data) => {
            await this.import(data, callback);
            fs.renameSync(path, "./data.old");
          }, path);
        } catch (error) {
          console.warn(error);
          callback(true);
        }
      }else{
        console.log("file " + path + " does not exist, no data is updated.");
        callback(true)
      };
    }

    /**
     * Einstiegsfunktion zum einlesen der csv und updaten der Datenbank
     * @param {String} input 
     * @param {Function} callback 
     */
    static importString(input, callback = (error)=>{if (error) console.log(error)}){
      this.loadString(async (data) => {
        try {
          await this.import(data, callback);
        }catch (error) {
          console.warn(error);
          callback(true);
        }
      }, input);
    }

    /**
     * Erstelle fake Werte in der Datenbank, welche auf der Struktur der angegebenen CSV aufbauen
     * Beispiel: require("./import").importFakeValues(amount = 2, path = "./data.old")
     * in die Debug Konsole eingeben um mindestens 2 Sätze an Fakedaten pro vorhandenem Tarif zu erstellen
     * Achtung das Ausführen kann einige Zeit dauern.
     * @param {Integer} amount Minimum pro Tarif, abhängig von der csv
     * @param {String} path 
     * @param {Function} callback 
     */
    static importFakeValues(amount = 1, path = "./data.csv", callback = (error)=>{if (error) console.log(error)}){
      console.log("Starting to insert fake values, only use for testing");
      if (fs.existsSync(path)){
        try {
          this.loadCSV(async (data) => {
            console.log("CSV loaded");
            for (let i=0; i<=amount; i++) {
              console.log("Import set: " + i);
              await this.import(data.map((e)=>{
                return {
                  tarifname: e.tarifname,
                  plz: e.plz,
                  fixkosten: Math.floor(Math.random()*10000)/10,
                  variablekosten: Math.floor(Math.random()*1000)/1000
                }
              }), callback);
            }
            fs.renameSync(path, "./data.old");
          }, path);
        } catch (error) {
          console.log(error);
          callback(true);
        }
      }else{
        console.warn("file " + path + " does not exist");
        callback(true)
      };
    }

    /**
     * Neue Werte in die Datenbank einbinden
     * @param {Array<Object>} data Liste an Werten mit folgendem Aufbau {tarifname, plz, fixkosten, variablekosten}
     * @param {function} callback
     */
    static async import(data, callback){
      try {
        const startTime = new Date();
        await Importer.importTarifnamen(data);
        await Importer.importTarife(data);
        const seconds = Math.round((new Date() - startTime)/100)/10;
        console.info(`import done after ${seconds} seconds`);
        callback();
      } catch (error) {
        console.warn(error);
        callback(true);
      }
    }

    /**
     * Lese vorhandenen Tarife aus dem csv import
     * Falls es neue Tarife gibt, werden diese in die Datenbank importier
     * @param  {Array} data
     */
    static async importTarifnamen(data) {
        const tarife = data.map((value) => value.tarifname).filter((v, i, a) => a.indexOf(v) === i);
        const insert_stmt = db.prepare(`INSERT INTO tarif (name) VALUES (?)`);
        const test_stmt = db.prepare(`SELECT * FROM tarif WHERE name = ?`);
        for (let i = 0; i < tarife.length; i++) {
            const name = tarife[i];
            const result = test_stmt.get(name);
            if (result === undefined) {
                console.log("Inserting Tarif " + name);
                await insert_stmt.run(name);
            }
        }
        //console.log(await db.all("SELECT * FROM tarif"));
    }

    /**
     * Return a Parser to parse a line of the given csv.
     * @return {Parser}
     */
    static lineParser(){
      return parse({
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
        columns: (names) => names.map((name) => name.toLowerCase()) });
    }

    /**
     * Lade data.csv und gebe die gelesenen Daten an die callbackfunktion weiter
     * @param {function} callback
     * @param {String} path
     */
    static loadCSV(callback, path) {
        const csvData = [];
        fs.createReadStream(path) 
          .pipe(this.lineParser())
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
   * Lade den String und gebe die gelesenen Daten an die callbackfunktion weiter
   * @param {function} callback
   * @param {String} input csv string
   */
  static loadString(callback, input){
    const csvData = [];
    Readable.from(input).pipe(this.lineParser())
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
  * Falls es neue Tarife gibt, werden diese in die Datenbank importiert, doppelte Einträge werden zu einem.
  * @param  {Array} data
  */
  static async importTarife(data){
    let samectr = 0;
    let doublectr = 0;
    let newctr = 0;

    //Alle Tarife werden auf inaktiv gesetzt
    db.prepare(`
      UPDATE tarif_plz
      SET aktiv = FALSE 
      WHERE aktiv = TRUE;
    `).run();
    console.info(`Updating database with ${data.length} values!`);
    const tarif_exists_stmt = db.prepare(`
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
            AND plz = ?);
    `);
    const tarif_enable_stmt = db.prepare(`
      UPDATE tarif_plz
      SET aktiv = TRUE
      WHERE tarif_plz_id = ?;
    `);
    const tarif_create_stmt = db.prepare(`
      INSERT INTO tarif_plz (tarif_id,plz,fixkosten,variablekosten,aktiv)
      VALUES ((SELECT tarif_id FROM tarif where name = ?),?,?,?,TRUE)
    `);

    //Jeder Datensatz wird durchlaufen und geprüft ob er bespeichert werden soll.
    for (let i = 0; i < data.length; i++) {
      //Bietet eine Prozentanzeige beim Import der Daten
      if ( i % (Math.floor(data.length/10)) == 0) console.log(Math.round((i/data.length)*100) + "%"); 
      const element = data[i];
      //Der Tarif muss schon genau so gespeichert sein und er muss der Aktuellste der jewiligen plz/namen kombination sein
      const tarifExists = tarif_exists_stmt.get(element.tarifname, element.plz, element.fixkosten, element.variablekosten, element.tarifname, element.plz);

      if (tarifExists !== undefined){
        if (tarifExists.aktiv){ //Ist der Tarif schon aktiv? kann nur sein, wenn er doppelt vorkommt
          doublectr++;
          //Existiert der Tarif schon und ist er aktiv? Doppelte Werte werden zu eins. Hochzählen für Statistik.
        } else{
          tarif_enable_stmt.run(tarifExists.tarif_plz_id);
          samectr++;
          //Tarif hat sich seit dem letzten Update nicht geändert.
        }
      }else{
        tarif_create_stmt.run(element.tarifname,element.plz,element.fixkosten,element.variablekosten);
        newctr++;
        //Neuer Tarif ist dazugekommen
      }
    }
    console.info(`-----------\nNew: ${newctr}\nSame: ${samectr}\nDouble: ${doublectr}\n-----------`);
    return {
      new: newctr,
      same: samectr,
      double: doublectr,
      total: data.length
    };
  }
}

module.exports = Importer;
