const User = require('../user/UserModel');
const Chat = require('../chat/ChatModel');
const Message = require('./MessageModel');
var logger = require('../../config/winston');
const { encrypt, decrypt } = require('../utils/CryptoUtil');

function getOwnMessages(chatID, userID, callback) {
    Chat.exists({ chatID: chatID }, function (err, exist) {
        if (exist) {
            var query = Chat.findOne({ chatID: chatID });
            query.exec(function (err, chat) {
                if (chat) {
                    if (chat.userID1 == userID || chat.userID2 == userID) {
                        var query = Message.find({ chatID: chatID });
                        query.select('userID chatID iv content -_id');
                        query.exec(function (err, messages) {
                            if (err) {
                                logger.error("Error on message search: " + err);
                                return callback(err, null);
                            } else {
                                const returnMessages = [];
                                for (let i = 0; i < messages.length; i++) {
                                    const hash = { iv: messages[i].iv, content: messages[i].content }
                                    const decryptedContent = decrypt(hash);
                                    returnMessages.push({
                                        userID: messages[i].userID,
                                        chatID: messages[i].chatID,
                                        content: decryptedContent
                                    });
                                }
                                logger.debug("messages for chatID '" + chatID + "' found: " + returnMessages);
                                return callback(null, returnMessages);
                            }
                        });
                    } else {
                        logger.error("user is not part of that chat");
                        return callback("user is not part of that chat", null);
                    }
                } else {
                    logger.error("Did not find chat for chatID: " + chatID);
                    return callback("Did not find chat for chatID: " + chatID, null);
                }
            });
        } else {
            logger.error("Chat doesn't exist");
            return callback("Chat doesn't exist", null);
        }
    });
}

function createMessage(message, callback) {
    if (message) {
        Message.exists({ messageID: message.messageID }, function (err, exist) {
            if (!exist) {
                Chat.exists({ chatID: message.chatID }, function (err, exist2) {
                    if (exist2) {
                        User.exists({ userID: message.userID }, function (err, exist3) {
                            if (exist3) {
                                logger.debug("creating message");
                                var NewMessage = new Message();
                                NewMessage.userID = message.userID;
                                NewMessage.chatID = message.chatID;
                                const hash = encrypt(message.content);
                                NewMessage.iv = hash.iv;
                                NewMessage.content = hash.content;
                                NewMessage.save(function (err) {
                                    if (err) {
                                        logger.error("Could not create message: " + err);
                                        callback("Could not create message", null);
                                    } else {
                                        updateChat(NewMessage, function (err, chat) {
                                            if (err) {
                                                logger.error("Created message, but did not update chat: " + err);
                                                callback("Created message, but did not update chat", null);
                                            } else {
                                                callback(null, NewMessage);
                                            }
                                        });
                                    }
                                });
                            } else {
                                logger.error("User doesn't exist");
                                callback("User doesn't exist", null);
                            }
                        });
                    } else {
                        logger.error("Chat doesn't exist");
                        callback("Chat doesn't exist", null);
                    }
                });
            } else {
                logger.error("Message already exists");
                callback("Message already exists", null);
            }
        });
    } else {
        logger.error("Got no message");
        callback("Got no message", null);
    }
}

function updateChat(newMessage, callback) {
    Chat.exists({ chatID: newMessage.chatID }, function (err, exist) {
        if (exist) {
            if (newMessage.iv && newMessage.content) {
                logger.debug("updating chat");
                var query = Chat.findOne({ chatID: newMessage.chatID });
                query.exec(function (err, chat) {
                    if (err || !chat) {
                        logger.error("Did not find chat for chatID: " + newMessage.chatID);
                        return callback("Did not find chat for chatID: " + newMessage.chatID, null);
                    } else {
                        chat.lastMessageIv = newMessage.iv;
                        chat.lastMessage = newMessage.content;
                        chat.save(function (err) {
                            if (err) {
                                logger.error("Could not update chat: " + err);
                                callback("Could not update chat", null);
                            } else {
                                callback(null, chat);
                            }
                        });
                    }
                });
            } else {
                logger.error("Got no new lastMessage");
                callback("Got no new lastMessage", null);
            }
        } else {
            logger.error("Chat with chatID '" + newMessage.chatID + "' doesn't exist");
            callback("Chat with chatID '" + newMessage.chatID + "' doesn't exist", null);
        }
    });
}

module.exports = {
    getOwnMessages,
    createMessage
}