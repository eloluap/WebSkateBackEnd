const express = require('express');
const router = express.Router();
var logger = require('../../config/winston');
var ac = require('../utils/AccessControlUtil');

var recensionService = require('./RecensionService');
const { isAuthenticated } = require('../utils/AuthenticationUtils');

// Route for getting a list with all recensions of a Skatepark
router.get('/skatepark/:skateparkID', isAuthenticated, function (req, res) {
    logger.debug("Trying to read all recensions");
    const permission = ac.can(req.role).readAny('recension');
    if (permission.granted) {
        recensionService.getRecensionsFromSkatepark(req.params.skateparkID, function (err, result) {
            if (result) {
                res.send(Object.values(result));
            } else {
                res.status(400).end();
            }
        });
    } else {
        logger.error("No permission for reading all recensions");
        res.status(401).end();
    }
});

// Route for creating a recension with values from the jsonbody "recension" on a skatepark with the skateparkID
router.post('/skatepark/:skateparkID/', isAuthenticated, function (req, res) {
    logger.debug("Trying to create recension");
    const permission = (req.userID === req.body.recension.userID)
        ? ac.can(req.role).createOwn('recension')
        : ac.can(req.role).createAny('recension');
    if (permission.granted) {
        if (req.body.recension) {
            if (req.body.recension.skateparkID === req.params.skateparkID) {
                recensionService.createRecension(req.body.recension, function (error, result) {
                    if (result) {
                        logger.info("Successfully created recension: " + result.recensionID);
                        res.end();
                    } else {
                        logger.error("Problem creating recension: " + error);
                        res.status(400).end();
                    }
                });
            } else {
                logger.error("skateparkID not matching");
                res.status(400).end();
            }
        } else {
            logger.error("No body.recension in req");
            res.status(400).end();
        }
    } else {
        logger.error("No permission for creating a recension (for that userID)");
        res.status(401).end();
    }
});

// Route for reading the recension with the recensionID as a parameter
router.get('/:recensionID', isAuthenticated, function (req, res) {
    logger.debug("Trying to read recension");
    const permission = ac.can(req.role).readAny('recension');
    if (permission.granted) {
        recensionService.findRecensionBy(req.params.recensionID, function (error, result) {
            if (result) {
                logger.debug("Successfully read recension: " + result.recensionID);
                const { recensionID, skateparkID, userID, content, rating, ...partialObject } = result;
                const subset = { recensionID, skateparkID, userID, content, rating };
                res.send(subset);
            } else {
                logger.error("There is no recension with this recensionID");
                res.status(400).end();
            }
        });
    } else {
        logger.error("No permission for reading a recension");
        res.status(401).end();
    }
});

// Route for updating the recension with the recensionID as a parameter - needs jsonbody "recension" with new values
router.put('/:recensionID', isAuthenticated, function (req, res) {
    logger.debug("Trying to update recension");
    recensionService.findRecensionBy(req.params.recensionID, function (error, result) {
        if (result) {
            logger.debug("To be changed recension is from user: " + result.userID);
            const permission = (req.userID === result.userID)
                ? ac.can(req.role).updateOwn('recension')
                : ac.can(req.role).updateAny('recension');
            if (permission.granted) {
                if (req.body.recension) {
                    recensionService.updateRecension(req.params.recensionID, req.body.recension, function (error2, result2) {
                        if (result2) {
                            logger.info("Successfully updated recension: " + result2.recensionID);
                            res.end();
                        } else {
                            logger.error("Problem updating recension: " + error2);
                            res.status(409).end();
                        }
                    });
                } else {
                    logger.error("No body.recension in req");
                    res.status(400).end();
                }
            } else {
                logger.error("No permission for updating a recension");
                res.status(401).end();
            }
        } else {
            logger.error("There is no recension with this recensionID");
            res.status(400).end();
        }
    });
});

// Route for deleting the recension with the recensionID as a parameter
router.delete('/:recensionID', isAuthenticated, function (req, res) {
    logger.debug("Trying to delete recension");
    recensionService.findRecensionBy(req.params.recensionID, function (error, result) {
        if (result) {
            const permission = (req.userID === result.userID)
                ? ac.can(req.role).deleteOwn('recension')
                : ac.can(req.role).deleteAny('recension');
            if (permission.granted) {
                recensionService.deleteRecension(req.params.recensionID, function (error, result2) {
                    if (result2) {
                        logger.info("Successfully deleted recension: " + req.params.recensionID);
                        res.end();
                    } else {
                        logger.error("Problem deleting recension: " + error);
                        res.status(400).end();
                    }
                });
            } else {
                logger.error("No permission for deleting a recension");
                res.status(401).end();
            }
        } else {
            logger.error("There is no recension with this recensionID");
            res.status(400).end();
        }
    });
});

module.exports = router;