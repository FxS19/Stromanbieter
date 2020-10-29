const { request } = require("express");

const sqlite3 = require('sqlite3');
const sqlite = require('sqlite');
const fs = require('fs');

async function provideDatabase(){
    const databaseExists = fs.existsSync('./.data/database.db');
    const db = await sqlite.open({
        filename: './.data/database.db',
        driver: sqlite3.Database
    });

    if (!databaseExists){
        await db.exec("CREATE TABLE cakes (id INTEGER PRIMARY KEY AUTOINCREMENT, name VARCHAR, weight INTEGER, uom VARCHAR)");
    }

    return db;
}

module.exports = provideDatabase;