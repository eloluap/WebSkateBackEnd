const express = require('express');
const router = express.Router();
var logger = require('../../config/winston');
var ac = require('../utils/AccessControlUtil');

var forumPostService = require('./ForumPostService');
const { isAuthenticated } = require('../utils/AuthenticationUtils');

// Route for getting a list with all forumPosts
router.get('/', function (req, res) {
    logger.debug("Trying to read all forumPosts");
    forumPostService.getForumPosts(function (err, result) {
        if (result) {
            res.send(Object.values(result));
        } else {
            res.status(500).end();
        }
    });
});

// Route for creating a forumPost with values from the jsonbody "forumPost"
router.post('/', isAuthenticated, function (req, res) {
    logger.debug("Trying to create forumPost");
    const permission = (req.userID === req.userID)
        ? ac.can(req.role).createOwn('forumPost')
        : ac.can(req.role).createAny('forumPost');
    if (permission.granted) {
        if (req.body.forumPost) {
            req.body.forumPost.userID = req.userID;
            forumPostService.createForumPost(req.body.forumPost, function (error, result) {
                if (result) {
                    logger.info("Successfully created forumPost: " + result.postID);
                    res.end();
                } else {
                    logger.error("Problem creating forumPost: " + error);
                    res.status(409).end();
                }
            });
        } else {
            logger.error("No body.forumpost in req");
            res.status(400).end();
        }
    } else {
        logger.error("No permission for creating a forumPost (for that userID)");
        res.status(401).end();
    }
});

// Route for reading the forumPost with the postID as a parameter
router.get('/:postID', isAuthenticated, function (req, res) {
    logger.debug("Trying to read forumPost");
    const permission = ac.can(req.role).readAny('forumPost');
    if (permission.granted) {
        forumPostService.findPostBy(req.params.postID, function (error, result) {
            if (result) {
                logger.debug("Successfully read forumPost: " + result.postID);
                const { postID, userID, titel, content, ...partialObject } = result;
                const subset = { postID, userID, titel, content };
                res.send(subset);
            } else {
                logger.error("There is no forumPost with this postID");
                res.status(400).end();
            }
        });
    } else {
        logger.error("No permission for reading a forumPost");
        res.status(401).end();
    }
});

// Route for updating the forumPost with the postID as a parameter - needs jsonbody "forumPost" with new values
router.put('/:postID', isAuthenticated, function (req, res) {
    logger.debug("Trying to update forumPost");
    forumPostService.findPostBy(req.params.postID, function (error, result) {
        if (result) {
            logger.debug("To be changed forumPost is from user: " + result.userID);
            const permission = (req.userID === result.userID)
                ? ac.can(req.role).updateOwn('forumPost')
                : ac.can(req.role).updateAny('forumPost');
            if (permission.granted) {
                if (req.body.forumPost) {
                    forumPostService.updateForumPost(req.params.postID, req.body.forumPost, function (error2, result2) {
                        if (result2) {
                            logger.info("Successfully updated forumPost: " + result2.postID);
                            res.end();
                        } else {
                            logger.error("Problem updating forumPost: " + error2);
                            res.status(409).end();
                        }
                    });
                } else {
                    logger.error("No body.forumPost in req");
                    res.status(400).end();
                }
            } else {
                logger.error("No permission for updating a forumPost");
                res.status(401).end();
            }
        } else {
            logger.error("There is no forumPost with this postID");
            res.status(400).end();
        }
    });
});

// Route for deleting the forumPost with the postID as a parameter
router.delete('/:postID', isAuthenticated, function (req, res) {
    logger.debug("Trying to delete forumPost");
    forumPostService.findPostBy(req.params.postID, function (error, result) {
        if (result) {
            const permission = (req.userID === result.userID)
                ? ac.can(req.role).deleteOwn('forumPost')
                : ac.can(req.role).deleteAny('forumPost');
            if (permission.granted) {
                forumPostService.deleteForumPost(req.params.postID, function (error, result2) {
                    if (result2) {
                        logger.info("Successfully deleted forumpost: " + req.params.postID);
                        res.end();
                    } else {
                        logger.error("Problem deleting forumPost: " + error);
                        res.status(400).end();
                    }
                });
            } else {
                logger.error("No permission for deleting a forumPost");
                res.status(401).end();
            }
        } else {
            logger.error("There is no forumPost with this postID");
            res.status(400).end();
        }
    });
});

module.exports = router;