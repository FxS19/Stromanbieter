/**
 * Diese Datei beinhaltet Funktionen zum Importieren einer CSV Datei in die Datenbank
*/
const csv = require('csv-parser');
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
        console.log(data);
        await Importer.importTarife(data);
    }

    /**
     * Lese vorhandenen Tarife aus dem csv import
     * Falls es neue Tarife gibt, werden diese in diue Datenbank 
     * @param  {Array} data
     */
    static async importTarife(data) {
        const tarife = data.map((value) => value.tarifname).filter((v, i, a) => a.indexOf(v) === i);
        //const db = await database();
        tarife.forEach((name) => {
            console.log(name);
            //const result = db.run("SELECT * FROM tarif wHERE name = ?", name);
            //console.log(result);
        });
    }

    /**Lade data.csv und gebe die gelesenen Daten an die callbackfunktion weiter
     * @param  {function} callback
     */
    static loadCSV(callback) {
        //CSV parsen und in results ablegen
        const results = [];
        fs.createReadStream('data.csv')
            .pipe(csv({
                mapHeaders: ({ header }) => header.toLowerCase(),
                separator: ";"
            }))
            .on('data', (data) => results.push(data))
            .on('end', () => {
                callback(results);
            });
    }
}

module.exports = Importer