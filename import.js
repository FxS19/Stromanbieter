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
        console.log(data);
        await Importer.importTarife(data);
        await Importer.importPLZ(data);
    }

    /**
     * Lese vorhandenen Tarife aus dem csv import
     * Falls es neue Tarife gibt, werden diese in die Datenbank importiert
     * @param  {Array} data
     */
    static async importTarife(data) {
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
        console.log(await db.all("SELECT * FROM tarif"));
    }

    /**
     * Lese vorhandenen Postleitzahlen aus dem csv import
     * Falls es neue Tarife gibt, werden diese in die Datenbank importiert
     * @param  {Array} data
     */
    static async importPLZ(data) {
        const plzs = data.map((value) => parseInt(value.plz)).filter((v, i, a) => a.indexOf(v) === i);
        const db = await database;
        for (let i = 0; i < plzs.length; i++) {
            const plz = plzs[i];
            const result = await db.get("SELECT * FROM plz WHERE plz = ?", plz);
            if (result === undefined) {
                console.log("Inserting PLZ " + plz);
                await db.run("INSERT INTO plz (plz) VALUES (?)", plz);
            }
        }
        console.log(await db.all("SELECT * FROM plz"));
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
}

module.exports = Importer