const express = require('express');
const router = express.Router();
var logger = require('../../config/winston');

var aiService = require('./AIService');
const { isAuthenticated } = require('../utils/AuthenticationUtils');

router.post("/", isAuthenticated, function (req, res, next) {
    logger.info("Got a parse user input request.");
    aiService.parseInput(req.body.userInput.content, function (error, result) {
        if (error) {
            logger.info("Problems parsing user input: " + error);
            res.status(400).end();
        } else {
            logger.info("Successfully parsed user input: " + result);
            const returnobj = { content: result }
            res.send(returnobj);
        }
    });
});

module.exports = router;