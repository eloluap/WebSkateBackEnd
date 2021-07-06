const express = require('express');
const crypto = require('crypto');
const router = express.Router();
var config = require("config");
var logger = require('../../config/winston');

const emailName = config.get('email.emailName');

var registrationService = require('./RegistrationService');
var authenticationService = require('../authentication/AuthenticationService');

router.post("/", function (req, res, next) {
    crypto.randomBytes(48, function (err, buffer) {
        var token = buffer.toString('hex');
        var expirationTime = Date.now() + (24 * 3600 * 1000);
        registrationService.registerUser(req.body.user, token, expirationTime, function (error, result) {
            if (!error) {
                var email = {
                    from: emailName,
                    to: req.body.user.email,
                    subject: "Aktivierungslink",
                    text: "Hier ist ihr Aktivierungslink, der für 24 Stunden gültig ist: https://localhost:8080/registration/" + token
                };
                registrationService.sendEmail(email, function (error, result) {
                    if (!error) {
                        logger.info("Successfully sent email with token: " + token);
                        logger.info("Creating jwtToken");
                        authenticationService.createSessionToken({ "userID": req.body.user.userID, "password": req.body.user.password }, function (err, jwtToken, user) {
                            if (jwtToken) {
                                res.header("Authorization", "Bearer " + jwtToken);
                                if (user) {
                                    const { id, userID, userName, ...partialObject } = user;
                                    const subset = { id, userID, userName };
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
                        logger.error("Problems sending email: " + error);
                        res.status(500).end();
                    }
                });
            } else {
                logger.error("Problems registering user in DB: " + error);
                let fixedError = "" + error;
                if (fixedError.includes("MongoError")) {
                    error = "Für diese E-Mail-Adresse existiert bereits ein Account, bitte eine andere E-Mail-Adresse nutzen."
                }
                if (fixedError.includes("ValidationError")) {
                    error = "Bitte alle Felder ausfüllen."
                }
                res.status(400).send({
                    message: error
                });
            }
        });
    });
});

router.get("/:token", function (req, res) {
    registrationService.validateToken(req.params.token, function (error, result) {
        if (error) {
            logger.info("Problems validating user with Email-Link: " + error);
            res.status(400).end();
        } else {
            logger.info("Successfully validated user with Email-Link");
        }
    });
});

module.exports = router;