const User = require('../user/UserModel');
const Chat = require('./ChatModel');
var logger = require('../../config/winston');
const { decrypt } = require('../utils/CryptoUtil');

function getOwnChats(userID, callback) {
    var query = Chat.find().or([{ userID1: userID }, { userID2: userID }]);
    query.select('chatID userID1 userID2 lastMessageIv lastMessage -_id');
    query.exec(function (err, chats) {
        if (err) {
            logger.error("Error on chat search: " + err);
            return callback(err, null);
        } else {
            const returnChats = [];
            for (let i = 0; i < chats.length; i++) {
                if (chats[i].lastMessage) {
                    const hash = { iv: chats[i].lastMessageIv, content: chats[i].lastMessage }
                    const decryptedContent = decrypt(hash);
                    returnChats.push({
                        userID1: chats[i].userID1,
                        userID2: chats[i].userID2,
                        chatID: chats[i].chatID,
                        lastMessage: decryptedContent
                    });
                } else {
                    returnChats.push({
                        userID1: chats[i].userID1,
                        userID2: chats[i].userID2,
                        chatID: chats[i].chatID
                    });
                }
            }
            logger.debug("chats for userID '" + userID + "' found: " + returnChats);
            return callback(null, returnChats);
        }
    });
}

function createChat(userID, otherUserID, callback) {
    if (userID && otherUserID) {
        if (userID != otherUserID) {
            var query = Chat.find().or([{
                $and: [
                    { userID1: userID },
                    { userID2: otherUserID }
                ]
            },
            {
                $and: [
                    { userID1: otherUserID },
                    { userID2: userID }
                ]
            }
            ]);
            query.exec(function (err, exist) {
                if (exist.length == 0) {
                    User.exists({ userID: userID }, function (err, exist2) {
                        if (exist2) {
                            User.exists({ userID: otherUserID }, function (err, exist3) {
                                if (exist3) {
                                    logger.debug("creating Chat");
                                    var NewChat = new Chat();
                                    NewChat.userID1 = userID;
                                    NewChat.userID2 = otherUserID;
                                    NewChat.save(function (err) {
                                        if (err) {
                                            logger.error("Could not create chat: " + err);
                                            callback("Could not create chat: " + err, null);
                                        } else {
                                            callback(null, NewChat);
                                        }
                                    });
                                } else {
                                    logger.error("User with userID '" + otherUserID + "' doesn't exist");
                                    callback("User with userID '" + otherUserID + "' doesn't exist", null);
                                }
                            });
                        } else {
                            logger.error("User with userID '" + userID + "' doesn't exist");
                            callback("User with userID '" + userID + "' doesn't exist", null);
                        }
                    });
                } else {
                    logger.error("Those users already have a chat");
                    callback("Those users already have a chat", null);
                }
            });
        } else {
            logger.error("Both userIDs are identical");
            callback("Both userIDs are identical", null);
        }
    } else {
        logger.error("Did not get two userIDs");
        callback("Did not get two userIDs", null);
    }
}

module.exports = {
    getOwnChats,
    createChat
}