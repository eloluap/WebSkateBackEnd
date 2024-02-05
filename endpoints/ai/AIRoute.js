const express = require('express');
const router = express.Router();
var logger = require('../../config/winston');

var aiService = require('./AIService');
const { isAuthenticated } = require('../utils/AuthenticationUtils');

router.post("/", isAuthenticated, function (req, res, next) {
    logger.info("Got a parse user input request.");
    const userInput = req.body.userInput.content;
    const postID = req.body.userInput.postID;
    if (userInput) {
        if (postID && postID == -1) {
            aiService.parseInputForumPage(userInput, function (error, result) {
                if (error) {
                    logger.info("Problems parsing user input: " + error);
                    res.status(400).end();
                } else {
                    logger.info("Successfully parsed user input: " + result);
                    const returnobj = { content: result }
                    res.send(returnobj);
                }
            });
        } else if (postID && postID >= 0) {
            aiService.parseInputPostPage(userInput, postID, function (error, result) {
                if (error) {
                    logger.info("Problems parsing user input: " + error);
                    res.status(400).end();
                } else {
                    logger.info("Successfully parsed user input: " + result);
                    const returnobj = { content: result }
                    res.send(returnobj);
                }
            });
        } else {
            logger.error("postID is missing");
            res.status(400).end();
        }
    } else {
        logger.error("Userinput is missing");
        res.status(400).end();
    }
});

module.exports = router;