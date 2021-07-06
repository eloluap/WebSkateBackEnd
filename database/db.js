var mongoose = require('mongoose');
const config = require('config');
var logger = require('../config/winston');

let db;

const connectionString = config.get('db.connectionString');
const dbConfigOptions = config.get('db.dbConfigOptions');

function initDB(callback) {
    if (db) {
        if (callback) {
            return callback(null, db);
        } else {
            return db;
        }
    } else {
        mongoose.connect(connectionString, dbConfigOptions);
        db = mongoose.connection;

        db.on('error', console.error.bind(console.error, 'connection error:'));
        db.once('open', function () {
            logger.info("Connected to database " + connectionString + " in DB.js: " + db);
            callback(null, db);
        });
    }
}

module.exports = {
    initDB
}