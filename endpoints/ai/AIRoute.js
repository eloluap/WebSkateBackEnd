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
                } else if (!result || !(result.method == "GET" || result.method == "POST")) {
                    logger.error("Parsing the user input resulted in no valid method");
                    res.status(400).end();
                } else if (result.method == "GET" && result.data && result.data.postID) {
                    aiService.getPostPage(result.data.postID, function (error, returnObj) {
                        if (error) {
                            logger.error("Problems transforming data: " + error);
                            res.status(400).end();
                        }
                        res.send(returnObj);
                    });
                } else if (result.method == "POST" && result.data && result.data.title && result.data.text) {
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
                } else if (!result || !(result.entity == "post" || result.entity == "comment")) {
                    logger.error("Parsing the user input resulted in no valid entity");
                    res.status(400).end();
                } else if (!(result.method == "POST" || result.method == "PUT" || result.method == "DELETE")) {
                    logger.error("Parsing the user input resulted in no valid method");
                    res.status(400).end();
                } else if (result.entity == "post" && result.method == "PUT" && result.data && (result.data.title || result.data.text)) {
                    aiService.updatePost(postID, result.data.title, result.data.text, function (error, returnObj) {
                        if (error) {
                            logger.error("Problems transforming data: " + error);
                            res.status(400).end();
                        }
                        res.send(returnObj);
                    });
                } else if (result.entity == "post" && result.method == "DELETE") {
                    aiService.deletePost(function (error, returnObj) {
                        if (error) {
                            logger.error("Problems transforming data: " + error);
                            res.status(400).end();
                        }
                        res.send(returnObj);
                    });
                } else if (result.entity == "comment" && result.method == "POST" && result.data && result.data.text) {
                    aiService.createComment(result.data.text, function (error, returnObj) {
                        if (error) {
                            logger.error("Problems transforming data: " + error);
                            res.status(400).end();
                        }
                        res.send(returnObj);
                    });
                } else if (result.entity == "comment" && result.method == "PUT" && result.data && result.data.text && result.data.commentID) {
                    aiService.updateComment(result.data.commentID, result.data.text, function (error, returnObj) {
                        if (error) {
                            logger.error("Problems transforming data: " + error);
                            res.status(400).end();
                        }
                        res.send(returnObj);
                    });
                } else if (result.entity == "comment" && result.method == "DELETE" && result.data && result.data.commentID) {
                    aiService.deleteComment(result.data.commentID, function (error, returnObj) {
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