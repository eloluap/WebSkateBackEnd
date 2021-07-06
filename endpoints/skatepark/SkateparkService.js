const Skatepark = require('./SkateparkModel');
var logger = require('../../config/winston');

function getSkateparks(callback) {
    var query = Skatepark.find();
    query.select('skateparkID name content -_id');
    query.exec(function (err, skateparks) {
        if (err) {
            logger.error("Error on skatepark search: " + err)
            return callback(err, null);
        } else {
            logger.debug("Skateparks found: " + skateparks);
            return callback(null, skateparks);
        }
    });
}

function findSkateparkBy(searchSkateparkID, callback) {
    logger.debug("SkateparkService: find skatepark by ID: " + searchSkateparkID);
    if (!searchSkateparkID) {
        callback("skateparkID is missing", null);
        return;
    } else {
        var query = Skatepark.findOne({ skateparkID: searchSkateparkID });
        query.exec(function (err, skatepark) {
            if (err) {
                logger.error("Did not find skatepark for postID: " + searchSkateparkID);
                return callback("Did not find skatepark for postID: " + searchSkateparkID, null);
            } else {
                logger.debug(`Found postID: ${searchSkateparkID}`);
                callback(null, skatepark);
            }
        });
    }
}

function createSkatepark(skatepark, callback) {
    if (skatepark) {
        Skatepark.exists({ skateparkID: skatepark.skateparkID }, function (err, exist) {
            if (!exist) {
                logger.debug("creating skatepark");
                var NewSkatepark = new Skatepark();
                NewSkatepark.name = skatepark.name;
                NewSkatepark.content = skatepark.content;
                NewSkatepark.save(function (err) {
                    if (err) {
                        logger.error("Could not create skatepark: " + err);
                        callback("Could not create skatepark", null);
                    } else {
                        callback(null, NewSkatepark);
                    }
                });
            } else {
                logger.error("Skatepark already exists");
                callback("Skatepark already exists", null);
            }
        });
    } else {
        logger.error("Got no skatepark");
        callback("Got no skatepark", null);
    }
}

function updateSkatepark(searchSkateparkID, updatedValues, callback) {
    if (searchSkateparkID) {
        Skatepark.exists({ skateparkID: searchSkateparkID }, function (err, exist) {
            if (exist) {
                logger.debug("updating skatepark");
                var query = Skatepark.findOne({ skateparkID: searchSkateparkID });
                query.exec(function (err, skatepark) {
                    if (err || !skatepark) {
                        logger.error("Did not find skatepark for skateparkID: " + searchSkateparkID);
                        return callback("Did not find skatepark for skateparkID: " + searchSkateparkID, null);
                    } else {
                        if (updatedValues.name) {
                            skatepark.name = updatedValues.name;
                        }
                        if (updatedValues.content) {
                            skatepark.content = updatedValues.content;
                        }
                        skatepark.save(function (err) {
                            if (err) {
                                logger.error("Could not update skatepark: " + err);
                                callback("Could not update skatepark", null);
                            } else {
                                callback(null, skatepark);
                            }
                        });
                    }
                });
            } else {
                logger.error("Skatepark doesn't exist");
                callback("Skatepark doesn't exist", null);
            }
        });
    } else {
        logger.error("Got no skateparkID");
        callback("Got no skateparkID", null);
    }
}

function deleteSkatepark(searchSkateparkID, callback) {
    if (searchSkateparkID) {
        Skatepark.exists({ skateparkID: searchSkateparkID }, function (err, exist) {
            if (exist) {
                logger.debug("deleting skatepark");
                var query = Skatepark.deleteOne({ skateparkID: searchSkateparkID });
                query.exec(function (err, result) {
                    if (err || !result) {
                        logger.error("Problems deleting skatepark with skateparkID: " + searchSkateparkID);
                        return callback("Problems deleting skatepark with skateparkID: " + searchSkateparkID, null);
                    } else {
                        callback(null, result);
                    }
                });
            } else {
                logger.error("Skatepark doesn't exist");
                callback("Skatepark doesn't exist", null);
            }
        });
    } else {
        logger.error("Got no skateparkID");
        callback("Got no skateparkID", null);
    }
}

module.exports = {
    getSkateparks,
    findSkateparkBy,
    createSkatepark,
    updateSkatepark,
    deleteSkatepark
}