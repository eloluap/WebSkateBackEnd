var mongoose = require('mongoose');
var AutoIncrement = require('mongoose-sequence')(mongoose);

const chatSchema = new mongoose.Schema({
    userID1: { type: String, required: true },
    userID2: { type: String, required: true },
    lastMessageIv: { type: String },
    lastMessage: { type: String }
}, { timestamps: true });

chatSchema.plugin(AutoIncrement, { inc_field: 'chatID' });

module.exports = mongoose.model("chat", chatSchema);