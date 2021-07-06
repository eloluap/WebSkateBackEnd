var mongoose = require('mongoose');
var AutoIncrement = require('mongoose-sequence')(mongoose);

const forumPostSchema = new mongoose.Schema({
    userID: { type: String, required: true },
    titel: { type: String, required: true },
    content: { type: String, required: true }
}, { timestamps: true });

forumPostSchema.plugin(AutoIncrement, { inc_field: 'postID' });

module.exports = mongoose.model("forumPost", forumPostSchema);