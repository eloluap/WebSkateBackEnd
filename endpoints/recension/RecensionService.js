const Skatepark = require('../skatepark/SkateparkModel');
const User = require('../user/UserModel');
const Recension = require('./RecensionModel');
var logger = require('../../config/winston');

function getRecensionsFromSkatepark(skateparkID, callback) {
    Skatepark.exists({ skateparkID: skateparkID }, function (err, exist) {
        if (exist) {
            var query = Recension.find({ skateparkID: skateparkID });
            query.select('recensionID skateparkID userID content rating -_id');
            query.exec(function (err, recensions) {
                if (err) {
                    logger.error("Error on skatepark search: " + err)
                    return callback(err, null);
                } else {
                    logger.debug("Recensions for skateparkID '" + skateparkID + "' found: " + recensions);
                    return callback(null, recensions);
                }
            });
        } else {
            logger.error("Skatepark doesn't exist");
            callback("Skatepark doesn't exist", null);
        }
    });
}

function findRecensionBy(searchRecensionID, callback) {
    logger.debug("RecensionService: find recension by ID: " + searchRecensionID);
    if (!searchRecensionID) {
        callback("recensionID is missing", null);
        return;
    } else {
        var query = Recension.findOne({ recensionID: searchRecensionID });
        query.exec(function (err, recension) {
            if (err) {
                logger.error("Did not find recension for recensionID: " + searchRecensionID);
                return callback("Did not find recension for recensionID: " + searchRecensionID, null);
            } else {
                logger.debug(`Found recensionID: ${searchRecensionID}`);
                callback(null, recension);
            }
        });
    }
}

function createRecension(recension, callback) {
    if (recension) {
        Recension.exists({ recensionID: recension.recensionID }, function (err, exist) {
            if (!exist) {
                Skatepark.exists({ skateparkID: recension.skateparkID }, function (err, exist2) {
                    if (exist2) {
                        User.exists({ userID: recension.userID }, function (err, exist3) {
                            if (exist3) {
                                logger.debug("creating recension");
                                var NewRecension = new Recension();
                                NewRecension.userID = recension.userID;
                                NewRecension.skateparkID = recension.skateparkID;
                                NewRecension.content = recension.content;
                                NewRecension.rating = recension.rating;
                                NewRecension.save(function (err) {
                                    if (err) {
                                        logger.error("Could not create recension: " + err);
                                        callback("Could not create recension", null);
                                    } else {
                                        callback(null, NewRecension);
                                    }
                                });
                            } else {
                                logger.error("User doesn't exist");
                                callback("User doesn't exist", null);
                            }
                        });
                    } else {
                        logger.error("Skatepark doesn't exist");
                        callback("Skatepark doesn't exist", null);
                    }
                });
            } else {
                logger.error("Recension already exists");
                callback("Recension already exists", null);
            }
        });
    } else {
        logger.error("Got no recension");
        callback("Got no recension", null);
    }
}

function updateRecension(searchRecensionID, updatedValues, callback) {
    if (searchRecensionID) {
        Recension.exists({ recensionID: searchRecensionID }, function (err, exist) {
            if (exist) {
                logger.debug("updating recension");
                var query = Recension.findOne({ recensionID: searchRecensionID });
                query.exec(function (err, recension) {
                    if (err || !recension) {
                        logger.error("Did not find recension for recensionID: " + searchRecensionID);
                        return callback("Did not find recension for recensionID: " + searchRecensionID, null);
                    } else {
                        if (updatedValues.content) {
                            recension.content = updatedValues.content;
                        }
                        if (updatedValues.rating) {
                            recension.rating = updatedValues.rating;
                        }
                        recension.save(function (err) {
                            if (err) {
                                logger.error("Could not update recension: " + err);
                                callback("Could not update recension", null);
                            } else {
                                callback(null, recension);
                            }
                        });
                    }
                });
            } else {
                logger.error("Recension doesn't exist");
                callback("Recension doesn't exist", null);
            }
        });
    } else {
        logger.error("Got no recensionID");
        callback("Got no recensionID", null);
    }
}

function deleteRecension(searchRecensionID, callback) {
    if (searchRecensionID) {
        Recension.exists({ recensionID: searchRecensionID }, function (err, exist) {
            if (exist) {
                logger.debug("deleting recension");
                var query = Recension.deleteOne({ recensionID: searchRecensionID });
                query.exec(function (err, result) {
                    if (err || !result) {
                        logger.error("Problems deleting recension with recensionID: " + searchRecensionID);
                        return callback("Problems deleting recension with recensionID: " + searchRecensionID, null);
                    } else {
                        callback(null, result);
                    }
                });
            } else {
                logger.error("Recension doesn't exist");
                callback("Recension doesn't exist", null);
            }
        });
    } else {
        logger.error("Got no recensionID");
        callback("Got no recensionID", null);
    }
}

module.exports = {
    getRecensionsFromSkatepark,
    createRecension,
    findRecensionBy,
    updateRecension,
    deleteRecension
}