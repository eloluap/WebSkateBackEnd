var userService = require('../user/UserService');
var jwt = require("jsonwebtoken");
var config = require("config");
var logger = require('../../config/winston')
var fs = require('fs');

const privateKey = fs.readFileSync('./cert/key.pem');

function createSessionToken(props, callback) {
    logger.debug("AuthenticationService: create Token");
    if (!props) {
        logger.error("Error: have no props");
        callback("Props missing", null, null);
        return
    } else {
        userService.findUserBy(props.userID, function (error, user) {
            if (user) {
                logger.debug("Found user, check the password");
                user.comparePassword(props.password, (err, isMatch) => {
                    if (err) {
                        logger.error("Password is invalid");
                        callback(err, null);
                    } else {
                        if (isMatch) {
                            logger.debug("Password is correct. Create token.");
                            var expirationTime = config.get('session.timeout');
                            let token = jwt.sign({ "user": user.userID }, privateKey, { expiresIn: expirationTime, algorithm: 'HS256' });
                            logger.info("Token created for user " + user.userID + ": " + token);
                            callback(null, token, user);
                        } else {
                            logger.error("Password or userID are invalid");
                            callback(err, null);
                        }
                    }
                });
            } else {
                logger.error("Session Services: Did not find user for user ID: " + props.userID);
                callback("Did not find user", null);
            }
        });
    }
}

module.exports = {
    createSessionToken
}