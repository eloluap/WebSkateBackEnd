const express = require('express');
const router = express.Router();
var logger = require('../../config/winston');
var ac = require('../utils/AccessControlUtil');

var commentService = require('./CommentService');
const { isAuthenticated } = require('../utils/AuthenticationUtils');

// Route for getting a list with all comments of a Post
router.get('/forum/:postID', isAuthenticated, function (req, res) {
    logger.debug("Trying to read all comments");
    const permission = ac.can(req.role).readAny('comment');
    if (permission.granted) {
        commentService.getCommentsFromPost(req.params.postID, function (err, result) {
            if (result) {
                res.send(Object.values(result));
            } else {
                res.status(400).end();
            }
        });
    } else {
        logger.error("No permission for reading all comments");
        res.status(401).end();
    }
});

// Route for creating a comment with values from the jsonbody "comment" on a post with the postID
router.post('/forum/:postID/', isAuthenticated, function (req, res) {
    logger.debug("Trying to create comment");
    const permission = (req.userID === req.body.comment.userID)
        ? ac.can(req.role).createOwn('comment')
        : ac.can(req.role).createAny('comment');
    if (permission.granted) {
        if (req.body.comment) {
            if (req.body.comment.postID === req.params.postID) {
                commentService.createComment(req.body.comment, function (error, result) {
                    if (result) {
                        logger.info("Successfully created comment: " + result.commentID);
                        res.end();
                    } else {
                        logger.error("Problem creating comment: " + error);
                        res.status(409).end();
                    }
                });
            } else {
                logger.error("postID not matching");
                res.status(400).end();
            }
        } else {
            logger.error("No body.comment in req");
            res.status(400).end();
        }
    } else {
        logger.error("No permission for creating a comment (for that userID)");
        res.status(401).end();
    }
});

// Route for reading the comment with the commentID as a parameter
router.get('/:commentID', isAuthenticated, function (req, res) {
    logger.debug("Trying to read comment");
    const permission = ac.can(req.role).readAny('comment');
    if (permission.granted) {
        commentService.findCommentBy(req.params.commentID, function (error, result) {
            if (result) {
                logger.debug("Successfully read comment: " + result.commentID);
                const { commentID, postID, userID, content, ...partialObject } = result;
                const subset = { commentID, postID, userID, content };
                res.send(subset);
            } else {
                logger.error("There is no comment with this commentID");
                res.status(400).end();
            }
        });
    } else {
        logger.error("No permission for reading a comment");
        res.status(401).end();
    }
});

// Route for updating the comment with the commentID as a parameter - needs jsonbody "comment" with new values
router.put('/:commentID', isAuthenticated, function (req, res) {
    logger.debug("Trying to update comment");
    commentService.findCommentBy(req.params.commentID, function (error, result) {
        if (result) {
            logger.debug("To be changed comment is from user: " + result.userID);
            const permission = (req.userID === result.userID)
                ? ac.can(req.role).updateOwn('comment')
                : ac.can(req.role).updateAny('comment');
            if (permission.granted) {
                if (req.body.comment) {
                    commentService.updateComment(req.params.commentID, req.body.comment, function (error2, result2) {
                        if (result2) {
                            logger.info("Successfully updated comment: " + result2.commentID);
                            res.end();
                        } else {
                            logger.error("Problem updating comment: " + error2);
                            res.status(409).end();
                        }
                    });
                } else {
                    logger.error("No body.comment in req");
                    res.status(400).end();
                }
            } else {
                logger.error("No permission for updating a comment");
                res.status(401).end();
            }
        } else {
            logger.error("There is no comment with this commentID");
            res.status(400).end();
        }
    });
});

// Route for deleting the comment with the commentID as a parameter
router.delete('/:commentID', isAuthenticated, function (req, res) {
    logger.debug("Trying to delete comment");
    commentService.findCommentBy(req.params.commentID, function (error, result) {
        if (result) {
            const permission = (req.userID === result.userID)
                ? ac.can(req.role).deleteOwn('comment')
                : ac.can(req.role).deleteAny('comment');
            if (permission.granted) {
                commentService.deleteComment(req.params.commentID, function (error, result2) {
                    if (result2) {
                        logger.info("Successfully deleted comment: " + req.params.commentID);
                        res.end();
                    } else {
                        logger.error("Problem deleting comment: " + error);
                        res.status(400).end();
                    }
                });
            } else {
                logger.error("No permission for deleting a comment");
                res.status(401).end();
            }
        } else {
            logger.error("There is no comment with this commentID");
            res.status(400).end();
        }
    });
});

module.exports = router;