const express = require('express');
const router = express.Router();
var logger = require('../../config/winston');
var ac = require('../utils/AccessControlUtil');

var messageService = require('./MessageService');
const { isAuthenticated } = require('../utils/AuthenticationUtils');

// Route for getting a list with all messages of a chat with the chatID
router.get('/:chatID', isAuthenticated, function (req, res) {
    logger.debug("Trying to read a chat");
    const permission = ac.can(req.role).readOwn('message');
    if (permission.granted) {
        messageService.getOwnMessages(req.params.chatID, req.userID, function (err, result) {
            if (result) {
                res.send(Object.values(result));
            } else {
                res.status(500).end();
            }
        });
    } else {
        logger.error("No permission for reading a chat");
        res.status(401).end();
    }
});

// Route for creating a message with values from the jsonbody "message" on a chat with the chatID
router.post('/:chatID/', isAuthenticated, function (req, res) {
    logger.debug("Trying to create message");
    const permission = (req.userID === req.body.message.userID)
        ? ac.can(req.role).createOwn('message')
        : ac.can(req.role).createAny('message');
    if (permission.granted) {
        if (req.body.message) {
            if (req.body.message.chatID === req.params.chatID) {
                messageService.createMessage(req.body.message, function (error, result) {
                    if (result) {
                        logger.info("Successfully created message: " + result.messageID);
                        res.end();
                    } else {
                        logger.error("Problem creating message: " + error);
                        res.status(400).end();
                    }
                });
            } else {
                logger.error("chatID not matching");
                res.status(400).end();
            }
        } else {
            logger.error("No body.message in req");
            res.status(400).end();
        }
    } else {
        logger.error("No permission for creating a message (for that userID)");
        res.status(401).end();
    }
});

module.exports = router;