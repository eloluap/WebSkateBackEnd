const ForumPost = require('../forumPost/ForumPostModel');
const User = require('../user/UserModel');
const Comment = require('./CommentModel');
var logger = require('../../config/winston');

var userService = require('../user/UserService');

function getCommentsFromPost(postID, callback) {
    ForumPost.exists({ postID: postID }, function (err, exist) {
        if (exist) {
            var query = Comment.find({ postID: postID });
            query.select('commentID postID userID content -_id');
            query.exec(function (err, comments) {
                if (err) {
                    logger.error("Error on comment search: " + err)
                    return callback(err, null);
                } else {
                    var returnComments = [];
                    var waitForEach = new Promise((resolve, reject) => {
                        if (comments.length == 0) {
                            resolve();
                        }
                        comments.forEach((e, index, array) => {
                            userService.findUserBy(e.userID, (error, user) => {
                                var userID = e.userID;
                                var userName = '[Gelöscht]'
                                if (user !== null) {
                                    userName = user.userName;
                                }
                                var postID = e.postID;
                                var commentID = e.commentID;
                                var content = e.content;
                                returnComments.push({
                                    userID,
                                    userName,
                                    postID,
                                    commentID,
                                    content
                                });
                                if (index === array.length - 1) resolve();
                            });
                        });
                    });

                    waitForEach.then(() => {
                        logger.debug("Comments for postID '" + postID + "' found: " + comments);
                        return callback(null, returnComments);
                    });
                }
            });
        } else {
            logger.error("Post doesn't exist");
            callback("Post doesn't exist", null);
        }
    });
}

function findCommentBy(searchCommentID, callback) {
    logger.debug("CommentService: find comment by ID: " + searchCommentID);
    if (!searchCommentID) {
        callback("commentID is missing", null);
        return;
    } else {
        var query = Comment.findOne({ commentID: searchCommentID });
        query.exec(function (err, comment) {
            if (err) {
                logger.error("Did not find comment for commentID: " + searchCommentID);
                return callback("Did not find comment for commentID: " + searchCommentID, null);
            } else {
                logger.debug(`Found commentID: ${searchCommentID}`);
                callback(null, comment);
            }
        });
    }
}

function createComment(comment, callback) {
    if (comment) {
        Comment.exists({ commentID: comment.commentID }, function (err, exist) {
            if (!exist) {
                ForumPost.exists({ postID: comment.postID }, function (err, exist2) {
                    if (exist2) {
                        User.exists({ userID: comment.userID }, function (err, exist3) {
                            if (exist3) {
                                logger.debug("creating comment");
                                var NewComment = new Comment();
                                NewComment.userID = comment.userID;
                                NewComment.postID = comment.postID;
                                NewComment.content = comment.content;
                                NewComment.save(function (err) {
                                    if (err) {
                                        logger.error("Could not create comment: " + err);
                                        callback("Could not create comment", null);
                                    } else {
                                        callback(null, NewComment);
                                    }
                                });
                            } else {
                                logger.error("User doesn't exist");
                                callback("User doesn't exist", null);
                            }
                        });
                    } else {
                        logger.error("Post doesn't exist");
                        callback("Post doesn't exist", null);
                    }
                });
            } else {
                logger.error("Comment already exists");
                callback("Comment already exists", null);
            }
        });
    } else {
        logger.error("Got no comment");
        callback("Got no comment", null);
    }
}

function updateComment(searchCommentID, updatedValues, callback) {
    if (searchCommentID) {
        Comment.exists({ commentID: searchCommentID }, function (err, exist) {
            if (exist) {
                logger.debug("updating comment");
                var query = Comment.findOne({ commentID: searchCommentID });
                query.exec(function (err, comment) {
                    if (err || !comment) {
                        logger.error("Did not find comment for commentID: " + searchCommentID);
                        return callback("Did not find comment for commentID: " + searchCommentID, null);
                    } else {
                        if (updatedValues.content) {
                            comment.content = updatedValues.content;
                        }
                        comment.save(function (err) {
                            if (err) {
                                logger.error("Could not update comment: " + err);
                                callback("Could not update comment", null);
                            } else {
                                callback(null, comment);
                            }
                        });
                    }
                });
            } else {
                logger.error("Comment doesn't exist");
                callback("Comment doesn't exist", null);
            }
        });
    } else {
        logger.error("Got no commentID");
        callback("Got no commentID", null);
    }
}

function deleteComment(searchCommentID, callback) {
    if (searchCommentID) {
        Comment.exists({ commentID: searchCommentID }, function (err, exist) {
            if (exist) {
                logger.debug("deleting comment");
                var query = Comment.deleteOne({ commentID: searchCommentID });
                query.exec(function (err, result) {
                    if (err || !result) {
                        logger.error("Problems deleting comment with commentID: " + searchCommentID);
                        return callback("Problems deleting comment with commentID: " + searchCommentID, null);
                    } else {
                        callback(null, result);
                    }
                });
            } else {
                logger.error("Comment doesn't exist");
                callback("Comment doesn't exist", null);
            }
        });
    } else {
        logger.error("Got no commentID");
        callback("Got no commentID", null);
    }
}

module.exports = {
    getCommentsFromPost,
    createComment,
    findCommentBy,
    updateComment,
    deleteComment
}