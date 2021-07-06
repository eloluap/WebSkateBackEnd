const User = require('./UserModel');
var config = require("config");
var logger = require('../../config/winston');

function getUsers(callback) {
    var query = User.find();
    query.select('userID userName role email -_id');
    query.exec(function (err, users) {
        if (err) {
            logger.error("Error on User search: " + err)
            return callback(err, null);
        } else {
            logger.debug("Users found: " + users);
            return callback(null, users);
        }
    });
}

function findUserBy(searchUserID, callback) {
    logger.debug("UserService: find User by ID: " + searchUserID);

    if (!searchUserID) {
        callback("userID is missing", null);
        return;
    } else {
        var query = User.findOne({ userID: searchUserID });
        query.exec(function (err, user) {
            if (err) {
                logger.error("Did not find user for userID: " + searchUserID);
                return callback("Did not find user for userID: " + searchUserID, null);
            } else {
                if (user) {
                    logger.debug(`Found userID: ${searchUserID}`);
                    callback(null, user);
                } else {
                    if ('admin' == searchUserID) {
                        logger.info('Do not have admin account yet. Create it with default password');
                        var adminUser = new User();
                        adminUser.userID = config.get('admin.userID');
                        adminUser.userName = config.get('admin.userID');
                        adminUser.role = config.get('admin.role');
                        adminUser.email = config.get('admin.email');
                        adminUser.password = config.get('admin.password');
                        adminUser.validated = true;

                        adminUser.save(function (err) {
                            if (err) {
                                logger.error("Could not create default admin account: " + err);
                                callback("Could not create default admin account", null);
                            } else {
                                callback(null, adminUser);
                            }
                        });
                    } else {
                        logger.error("Did not find user for userID: " + searchUserID);
                        callback(null, user);
                    }
                }
            }
        });
    }
}

function getRoleBy(searchUserID, callback) {
    logger.debug("Looking up role for user: " + searchUserID);
    if (!searchUserID) {
        logger.error("userID is missing");
        callback("userID is missing", null);
        return;
    } else {
        var query = User.findOne({ userID: searchUserID });
        query.exec(function (err, user) {
            if (err) {
                logger.error("Did not find user for userID: " + searchUserID);
                return callback("Did not find user for userID: " + searchUserID, null);
            } else {
                if (user) {
                    logger.debug(`Found userID: ${searchUserID}, looking up role`);
                    if (user.role) {
                        logger.debug("User role is " + user.role);
                        callback(null, user.role);
                    } else {
                        logger.debug("User has no role, using default role user");
                        callback(null, 'user');
                    }
                } else {
                    logger.error("Did not find user for userID: " + searchUserID);
                    callback("Did not find user for userID: " + searchUserID, null);
                }
            }
        });
    }
}

function createUser(user, callback) {
    if (user) {
        User.exists({ userID: user.userID }, function (err, exist) {
            if (!exist) {
                User.exists({ userName: user.userID }, function (err, exist2) {
                    if (!exist2) {
                        logger.debug("creating user");
                        var NewUser = new User();
                        NewUser.userID = user.userID;
                        NewUser.userName = user.userID;
                        NewUser.role = "user";
                        NewUser.email = user.email;
                        NewUser.password = user.password;
                        NewUser.validated = true;

                        NewUser.save(function (err) {
                            if (err) {
                                logger.error("Could not create user: " + err);
                                callback("Could not create user", null);
                            } else {
                                callback(null, NewUser);
                            }
                        });
                    } else {
                        logger.error("User already exists");
                        callback("User already exists", null);
                    }
                });
            } else {
                logger.error("User already exists");
                callback("User already exists", null);
            }
        });
    } else {
        logger.error("Got no user");
        callback("Got no user", null);
    }
}

function updateUser(searchUserID, updatedValues, callback) {
    if (searchUserID) {
        User.exists({ userID: searchUserID }, function (err, exist) {
            if (exist) {
                logger.debug("updating user");
                var query = User.findOne({ userID: searchUserID });
                query.exec(function (err, user) {
                    if (err || !user) {
                        logger.error("Did not find user for userID: " + searchUserID);
                        return callback("Did not find user for userID: " + searchUserID, null);
                    } else {
                        if (updatedValues.userName) {
                            user.userName = updatedValues.userName;
                        }
                        if (updatedValues.email) {
                            user.email = updatedValues.email;
                        }
                        if (updatedValues.password) {
                            user.password = updatedValues.password;
                        }
                        user.save(function (err) {
                            if (err) {
                                logger.error("Could not update user: " + err);
                                callback("Could not update user", null);
                            } else {
                                callback(null, user);
                            }
                        });
                    }
                });
            } else {
                logger.error("User doesn't exist");
                callback("User doesn't exist", null);
            }
        });
    } else {
        logger.error("Got no userID");
        callback("Got no userID", null);
    }
}

function deleteUser(searchUserID, callback) {
    if (searchUserID) {
        User.exists({ userID: searchUserID }, function (err, exist) {
            if (exist) {
                logger.debug("deleting user");
                var query = User.deleteOne({ userID: searchUserID });
                query.exec(function (err, result) {
                    if (err || !result) {
                        logger.error("Problems deleting user with userID: " + searchUserID);
                        return callback("Problems deleting user with userID: " + searchUserID, null);
                    } else {
                        callback(null, result);
                    }
                });
            } else {
                logger.error("User doesn't exist");
                callback("User doesn't exist", null);
            }
        });
    } else {
        logger.error("Got no userID");
        callback("Got no userID", null);
    }
}

module.exports = {
    getUsers,
    findUserBy,
    getRoleBy,
    createUser,
    updateUser,
    deleteUser
}