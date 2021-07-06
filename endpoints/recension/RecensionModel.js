var mongoose = require('mongoose');
var AutoIncrement = require('mongoose-sequence')(mongoose);

const recensionSchema = new mongoose.Schema({
    userID: { type: String, required: true },
    skateparkID: { type: String, required: true },
    content: { type: String, required: true },
    rating: { type: Number, required: true, min: 1, max: 5 }
}, { timestamps: true });

recensionSchema.plugin(AutoIncrement, { inc_field: 'recensionID' });

module.exports = mongoose.model("recension", recensionSchema);