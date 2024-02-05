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
                    logger.error("Problems parsing user input: " + error);
                    res.status(400).end();
                }
                // TODO: Logic executing API Call
                if (!result || !(result.method == "GET" || result.method == "POST")) {
                    logger.error("Parsing the user input resulted in no valid method");
                    res.status(400).end();
                }
                if (result.method == "GET" && result.data && result.data.postID) {
                    // TODO: Send postID back and execute another API Call to change site and load post and comments
                    aiService.getPostPage(result.data.postID, function (error, returnObj) {
                        if (error) {
                            logger.error("Problems transforming data: " + error);
                            res.status(400).end();
                        }
                        res.send(returnObj);
                    });
                } else if (result.method == "POST" && result.data && result.data.title && result.data.text) {
                    // TODO: Send title and text back and execute another API Call to create the post
                    aiService.createPost(result.data.title, result.data.text, function (error, returnObj) {
                        if (error) {
                            logger.error("Problems transforming data: " + error);
                            res.status(400).end();
                        }
                        res.send(returnObj);
                    });
                } else {
                    logger.error("Parsing the user input resulted in not enough information to perform an action");
                    res.status(400).end();
                }
            });
        } else if (postID && postID >= 0) {
            aiService.parseInputPostPage(userInput, postID, function (error, result) {
                if (error) {
                    logger.error("Problems parsing user input: " + error);
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