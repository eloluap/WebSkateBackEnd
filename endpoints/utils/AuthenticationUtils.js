var jwt = require("jsonwebtoken");
var atob = require("atob");
var logger = require('../../config/winston');
var userService = require('../user/UserService');
var fs = require('fs');

const privateKey = fs.readFileSync('./cert/key.pem');

function isAuthenticated(req, res, next) {
    if (typeof req.headers.authorization !== "undefined") {
        let token = req.headers.authorization.split(" ")[1];
        jwt.verify(token, privateKey, { algorithm: "HS256" }, (err, userVerify) => {
            if (err) {
                res.status(401).json({ error: "Not Authorized" });
                logger.error("Not Authorized, wrong token");
                return;
            }
            logger.debug("Token is valid");
            var payload = JSON.parse(atob(token.split('.')[1]));
            req.tokenData = payload;
            req.userID = payload.user;
            userService.findUserBy(req.userID, function (error, user) {
                if (user.validated == true) {
                    userService.getRoleBy(req.userID, function (error, role) {
                        if (error) {
                            logger.error("Problem getting role: " + error);
                            req.role = "user";
                        } else {
                            logger.debug("Got role " + role + " from user " + req.userID);
                            req.role = role;
                        }
                        return next();
                    });
                } else {
                    logger.error("User is not validated");
                    res.status(401).end();
                }
            });
        });
    } else {
        logger.error("Not Authorized, no Authorization sent");
        res.status(401).end();
        return;
    }
}

module.exports = {
    isAuthenticated
}