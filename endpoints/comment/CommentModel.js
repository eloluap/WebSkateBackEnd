var mongoose = require('mongoose');
var AutoIncrement = require('mongoose-sequence')(mongoose);

const commentSchema = new mongoose.Schema({
    userID: { type: String, required: true },
    postID: { type: String, required: true },
    content: { type: String, required: true }
}, { timestamps: true });

commentSchema.plugin(AutoIncrement, { inc_field: 'commentID' });

module.exports = mongoose.model("comment", commentSchema);