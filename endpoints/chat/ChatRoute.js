const express = require('express');
const router = express.Router();
var logger = require('../../config/winston');
var ac = require('../utils/AccessControlUtil');

var chatService = require('./chatService');
const { isAuthenticated } = require('../utils/AuthenticationUtils');

// Route for getting a list with all chats of the logged in user (using userID from token)
router.get('/', isAuthenticated, function (req, res) {
    logger.debug("Trying to read own chats");
    const permission = ac.can(req.role).readOwn('chat');
    if (permission.granted) {
        chatService.getOwnChats(req.userID, function (err, result) {
            if (result) {
                res.send(Object.values(result));
            } else {
                res.status(500).end();
            }
        });
    } else {
        logger.error("No permission for reading own chats");
        res.status(401).end();
    }
});

// Route for creating a chat with another user which userID is a parameter
router.post('/:otherUserID/', isAuthenticated, function (req, res) {
    logger.debug("Trying to create chat");
    const permission = ac.can(req.role).createOwn('chat');
    if (permission.granted) {
        chatService.createChat(req.userID, req.params.otherUserID, function (error, result) {
            if (result) {
                logger.info("Successfully created chat: " + result.chatID);
                res.end();
            } else {
                logger.error("Problem creating chat: " + error);
                res.status(400).end();
            }
        });
    } else {
        logger.error("No permission for creating a chat");
        res.status(401).end();
    }
});

module.exports = router;