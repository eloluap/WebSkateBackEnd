const express = require('express');
const router = express.Router();
var logger = require('../../config/winston');

var authenticationService = require('./AuthenticationService');

router.post('/loginBasic', function (req, res, next) {
    logger.debug("Want to create token");
    if (req.headers.authorization) {
        const base64Credentials = req.headers.authorization.split(' ')[1];
        const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
        const [userID, password] = credentials.split(':');
        authenticationService.createSessionToken({ "userID": userID, "password": password }, function (err, token, user) {
            if (token) {
                res.header("Authorization", "Bearer " + token);
                if (user) {
                    const { id, userID, userName, validated, ...partialObject } = user;
                    const subset = { id, userID, userName, validated };
                    res.send(subset);
                } else {
                    logger.error("User is null, even though a token has been created. Error: " + err);
                    res.status(500).end();
                }
            } else {
                logger.error("Token has not been created. Error: " + err);
                res.status(401).end();
            }
        });
    } else {
        logger.error("Request does not contain authorization header: " + err);
        res.status(401).end();
    }
});

module.exports = router;