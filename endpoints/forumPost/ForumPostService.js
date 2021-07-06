const ForumPost = require('./ForumPostModel');
const User = require('../user/UserModel');
var logger = require('../../config/winston');

function getForumPosts(callback) {
    var query = ForumPost.find();
    query.select('postID userID titel content -_id');
    query.exec(function (err, forumPosts) {
        if (err) {
            logger.error("Error on forumPost search: " + err)
            return callback(err, null);
        } else {
            logger.debug("ForumPosts found: " + forumPosts);
            return callback(null, forumPosts);
        }
    });
}

function findPostBy(searchPostID, callback) {
    logger.debug("ForumPostService: find forumPost by ID: " + searchPostID);
    if (!searchPostID) {
        callback("postID is missing", null);
        return;
    } else {
        var query = ForumPost.findOne({ postID: searchPostID });
        query.exec(function (err, forumPost) {
            if (err) {
                logger.error("Did not find forumPost for postID: " + searchPostID);
                return callback("Did not find forumPost for postID: " + searchPostID, null);
            } else {
                logger.debug(`Found postID: ${searchPostID}`);
                callback(null, forumPost);
            }
        });
    }
}

function createForumPost(forumPost, callback) {
    if (forumPost) {
        ForumPost.exists({ postID: forumPost.postID }, function (err, exist) {
            if (!exist) {
                User.exists({ userID: forumPost.userID }, function (err, exist2) {
                    if (exist2) {
                        logger.debug("creating forumPost");
                        var NewForumPost = new ForumPost();
                        NewForumPost.userID = forumPost.userID;
                        NewForumPost.titel = forumPost.titel;
                        NewForumPost.content = forumPost.content;
                        NewForumPost.save(function (err) {
                            if (err) {
                                logger.error("Could not create forumPost: " + err);
                                callback("Could not create forumPost", null);
                            } else {
                                callback(null, NewForumPost);
                            }
                        });
                    } else {
                        logger.error("User doesn't exist");
                        callback("User doesn't exist", null);
                    }
                });
            } else {
                logger.error("ForumPost already exists");
                callback("ForumPost already exists", null);
            }
        });
    } else {
        logger.error("Got no forumPost");
        callback("Got no forumPost", null);
    }
}

function updateForumPost(searchPostID, updatedValues, callback) {
    if (searchPostID) {
        ForumPost.exists({ postID: searchPostID }, function (err, exist) {
            if (exist) {
                logger.debug("updating forumPost");
                var query = ForumPost.findOne({ postID: searchPostID });
                query.exec(function (err, forumPost) {
                    if (err || !forumPost) {
                        logger.error("Did not find forumPost for postID: " + searchPostID);
                        return callback("Did not find forumPost for postID: " + searchPostID, null);
                    } else {
                        if (updatedValues.titel) {
                            forumPost.titel = updatedValues.titel;
                        }
                        if (updatedValues.content) {
                            forumPost.content = updatedValues.content;
                        }
                        forumPost.save(function (err) {
                            if (err) {
                                logger.error("Could not update forumPost: " + err);
                                callback("Could not update forumPost", null);
                            } else {
                                callback(null, forumPost);
                            }
                        });
                    }
                });
            } else {
                logger.error("ForumPost doesn't exist");
                callback("ForumPost doesn't exist", null);
            }
        });
    } else {
        logger.error("Got no postID");
        callback("Got no postID", null);
    }
}

function deleteForumPost(searchPostID, callback) {
    if (searchPostID) {
        ForumPost.exists({ postID: searchPostID }, function (err, exist) {
            if (exist) {
                logger.debug("deleting forumPost");
                var query = ForumPost.deleteOne({ postID: searchPostID });
                query.exec(function (err, result) {
                    if (err || !result) {
                        logger.error("Problems deleting forumPost with postID: " + searchPostID);
                        return callback("Problems deleting forumPost with postID: " + searchPostID, null);
                    } else {
                        callback(null, result);
                    }
                });
            } else {
                logger.error("ForumPost doesn't exist");
                callback("ForumPost doesn't exist", null);
            }
        });
    } else {
        logger.error("Got no postID");
        callback("Got no postID", null);
    }
}

module.exports = {
    getForumPosts,
    findPostBy,
    createForumPost,
    updateForumPost,
    deleteForumPost
}