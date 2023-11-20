const express = require('express');
const router = express.Router();
var logger = require('../../config/winston');
var ac = require('../utils/AccessControlUtil');

var skateparkService = require('./SkateparkService');
const { isAuthenticated } = require('../utils/AuthenticationUtils');

// Route for getting a list with all skateparks
router.get('/', isAuthenticated, function (req, res) {
    logger.debug("Trying to read all skateparks");
    const permission = ac.can(req.role).readAny('skatepark');
    if (permission.granted) {
        skateparkService.getSkateparks(function (err, result) {
            if (result) {
                res.send(Object.values(result));
            } else {
                res.status(500).end();
            }
        });
    } else {
        logger.error("No permission for reading all skateparks");
        res.status(401).end();
    }
});

// Route for creating a skatepark with values from the jsonbody "skatepark"
router.post('/', isAuthenticated, function (req, res) {
    logger.debug("Trying to create skatepark");
    const permission = ac.can(req.role).createAny('skatepark');
    if (permission.granted) {
        if (req.body.skatepark) {
            skateparkService.createSkatepark(req.body.skatepark, function (error, result) {
                if (result) {
                    logger.info("Successfully created skatepark: " + result.skateparkID);
                    res.end();
                } else {
                    logger.error("Problem creating skatepark: " + error);
                    res.status(409).end();
                }
            });
        } else {
            logger.error("No body.skatepark in req");
            res.status(400).end();
        }
    } else {
        logger.error("No permission for creating a skatepark");
        res.status(401).end();
    }
});

// Route for reading the skatepark with the skateparkID as a parameter
router.get('/:skateparkID', isAuthenticated, function (req, res) {
    logger.debug("Trying to read skatepark");
    const permission = ac.can(req.role).readAny('skatepark');
    if (permission.granted) {
        skateparkService.findSkateparkBy(req.params.skateparkID, function (error, result) {
            if (result) {
                logger.debug("Successfully read skatepark: " + result.skateparkID);
                const { skateparkID, name, content, ...partialObject } = result;
                const subset = { skateparkID, name, content };
                res.send(subset);
            } else {
                logger.error("There is no skatepark with this skateparkID");
                res.status(400).end();
            }
        });
    } else {
        logger.error("No permission for reading a skatepark");
        res.status(401).end();
    }
});

// Route for updating the skatepark with the skateparkID as a parameter - needs jsonbody "skatepark" with new values
router.put('/:skateparkID', isAuthenticated, function (req, res) {
    logger.debug("Trying to update skatepark");
    skateparkService.findSkateparkBy(req.params.skateparkID, function (error, result) {
        if (result) {
            const permission = ac.can(req.role).updateAny('skatepark');
            if (permission.granted) {
                if (req.body.skatepark) {
                    skateparkService.updateSkatepark(req.params.skateparkID, req.body.skatepark, function (error2, result2) {
                        if (result2) {
                            logger.info("Successfully updated skatepark: " + result2.postID);
                            res.end();
                        } else {
                            logger.error("Problem updating skatepark: " + error2);
                            res.status(409).end();
                        }
                    });
                } else {
                    logger.error("No body.skatepark in req");
                    res.status(400).end();
                }
            } else {
                logger.error("No permission for updating a skatepark");
                res.status(401).end();
            }
        } else {
            logger.error("There is no skatepark with this skateparkID");
            res.status(400).end();
        }
    });
});

// Route for deleting the skatepark with the skateparkID as a parameter
router.delete('/:skateparkID', isAuthenticated, function (req, res) {
    logger.debug("Trying to delete skatepark");
    skateparkService.findSkateparkBy(req.params.skateparkID, function (error, result) {
        if (result) {
            const permission = ac.can(req.role).deleteAny('skatepark');
            if (permission.granted) {
                skateparkService.deleteSkatepark(req.params.skateparkID, function (error, result2) {
                    if (result2) {
                        logger.info("Successfully deleted skatepark: " + req.params.skateparkID);
                        res.end();
                    } else {
                        logger.error("Problem deleting skatepark: " + error);
                        res.status(400).end();
                    }
                });
            } else {
                logger.error("No permission for deleting a skatepark");
                res.status(401).end();
            }
        } else {
            logger.error("There is no skatepark with this skateparkID");
            res.status(400).end();
        }
    });
});

module.exports = router;