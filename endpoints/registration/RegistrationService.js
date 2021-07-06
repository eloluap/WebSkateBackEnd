const User = require('../user/UserModel');
var config = require("config");
var logger = require('../../config/winston');

var nodemailer = require("nodemailer");
const emailName = config.get('email.emailName');
const emailPassword = config.get('email.emailPassword');
const transport = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: emailName,
        pass: emailPassword
    }
});

function registerUser(user, token, expirationTime, callback) {
    if (user) {
        User.exists({ userID: user.userID }, function (err, exist) {
            if (!exist) {
                User.exists({ userName: user.userID }, function (err, exist2) {
                    if (!exist2) {
                        logger.debug("registering user");
                        var NewUser = new User();
                        NewUser.userID = user.userID;
                        NewUser.userName = user.userID;
                        NewUser.role = "user";
                        NewUser.email = user.email;
                        NewUser.password = user.password;
                        NewUser.token = token;
                        NewUser.expirationTime = expirationTime;
                        NewUser.save(function (err) {
                            if (err) {
                                logger.error("Could not create user: " + err);
                                callback(err, null);
                            } else {
                                callback(null, NewUser);
                            }
                        });
                    } else {
                        logger.error("User already exists");
                        callback("Ein Account mit diesem Nutzernamen existiert bereits, bitte einen anderen wählen!", null);
                    }
                });
            } else {
                logger.error("User already exists");
                callback("Ein Account mit diesem Nutzernamen existiert bereits, bitte einen anderen wählen!", null);
            }
        });
    } else {
        logger.error("Got no user");
        callback("Got no user", null);
    }
}

function sendEmail(email, callback) {
    transport.sendMail(email, function (error, info) {
        if (!error) {
            callback(null, info);
        } else {
            callback(error);
        }
    });
}

function validateToken(token, callback) {
    var query = User.findOne({ token: token });
    query.exec(function (err, user) {
        if (user) {
            if (user.expirationTime > Date.now()) {
                user.validated = true;
                user.save(function (err) {
                    if (err) {
                        logger.error("Could not update user: " + err);
                        callback("Could not update user", null);
                    } else {
                        callback(null, user);
                    }
                });
            }
        } else {
            logger.error("Did not find user for token: " + token);
            return callback("Did not find user for token: " + token, null);
        }
    });
}

module.exports = {
    registerUser,
    sendEmail,
    validateToken
}