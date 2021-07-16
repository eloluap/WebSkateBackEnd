const express = require('express');
const router = express.Router();
var logger = require('../../config/winston');
var ac = require('../utils/AccessControlUtil');

var userService = require('./UserService');
const { isAuthenticated } = require('../utils/AuthenticationUtils');

// Route for getting a list with all users
router.get('/', isAuthenticated, function (req, res) {
    logger.debug("Trying to read all users");
    const permission = ac.can(req.role).readAny('user');
    if (permission.granted) {
        userService.getUsers(function (err, result) {
            if (result) {
                res.send(Object.values(result));
            } else {
                res.status(500).end();
            }
        });
    } else {
        logger.error("No permission for reading all users");
        res.status(401).end();
    }
});

// Route for creating a user with with values from the jsonbody "user"
router.post('/', isAuthenticated, function (req, res) {
    logger.debug("Trying to create user");
    const permission = (req.userID === req.body.user.userID)
        ? ac.can(req.role).createOwn('user')
        : ac.can(req.role).createAny('user');
    if (permission.granted) {
        if (req.body.user) {
            userService.createUser(req.body.user, function (error, result) {
                if (result) {
                    logger.info("Successfully created user: " + result.userID);
                    res.end();
                } else {
                    logger.error("Problem creating user: " + error);
                    res.status(409).end();
                }
            });
        } else {
            logger.error("No body.user in req");
            res.status(400).end();
        }
    } else {
        logger.error("No permission for creating a user");
        res.status(401).end();
    }
});

// Route for reading the user with the userID as a parameter
router.get('/:userID', isAuthenticated, function (req, res) {
    logger.debug("Trying to read user");
    const permission = (req.userID === req.params.userID)
        ? ac.can(req.role).readOwn('user')
        : ac.can(req.role).readAny('user');
    if (permission.granted) {
        userService.findUserBy(req.params.userID, function (error, result) {
            if (result) {
                logger.debug("Successfully read user: " + result.userID);
                const { userID, userName, role, email, ...partialObject } = result;
                const subset = { userID, userName, role, email };
                res.send(subset);
            } else {
                logger.error("There is no user with this userID");
                res.status(400).end();
            }
        });
    } else {
        logger.error("No permission for reading a user");
        res.status(401).end();
    }
});

// Route for updating the user with the userID as a parameter - needs jsonbody "user" with new values
router.put('/:userID', isAuthenticated, function (req, res) {
    logger.debug("Trying to update user");
    const permission = (req.userID === req.params.userID)
        ? ac.can(req.role).updateOwn('user')
        : ac.can(req.role).updateAny('user');
    if (permission.granted) {
        if (req.body.user) {
            userService.updateUser(req.params.userID, req.body.user, function (error, result) {
                if (result) {
                    logger.info("Successfully updated user: " + result.userID);
                    const { id, userID, userName, role, email, validated, ...partialObject } = result;
                    const subset = { id, userID, userName, role, email, validated };
                    res.send(subset);
                    /* res.end(); */
                } else {
                    logger.error("Problem updating user: " + error);
                    res.status(409).end();
                }
            });
        } else {
            logger.error("No body.user in req");
            res.status(400).end();
        }
    } else {
        logger.error("No permission for updating a user");
        res.status(401).end();
    }
});

// Route for deleting the user with the userID as a parameter
router.delete('/:userID', isAuthenticated, function (req, res) {
    logger.debug("Trying to delete user");
    const permission = (req.userID === req.params.userID)
        ? ac.can(req.role).deleteOwn('user')
        : ac.can(req.role).deleteAny('user');
    if (permission.granted) {
        userService.deleteUser(req.params.userID, function (error, result) {
            if (result) {
                logger.info("Successfully deleted user: " + req.params.userID);
                res.end();
            } else {
                logger.error("Problem deleting user: " + error);
                res.status(400).end();
            }
        });
    } else {
        logger.error("No permission for deleting a user");
        res.status(401).end();
    }
});

module.exports = router;