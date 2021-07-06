var mongoose = require('mongoose');
var AutoIncrement = require('mongoose-sequence')(mongoose);

const messageSchema = new mongoose.Schema({
    userID: { type: String, required: true },
    chatID: { type: String, required: true },
    iv: { type: String, required: true },
    content: { type: String, required: true }
}, { timestamps: true });

messageSchema.plugin(AutoIncrement, { inc_field: 'messageID' });

module.exports = mongoose.model("message", messageSchema);