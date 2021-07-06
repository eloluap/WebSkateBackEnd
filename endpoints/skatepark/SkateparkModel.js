var mongoose = require('mongoose');
var AutoIncrement = require('mongoose-sequence')(mongoose);

const skateparkSchema = new mongoose.Schema({
    name: { type: String, required: true },
    content: { type: String, required: true }
}, { timestamps: true });

skateparkSchema.plugin(AutoIncrement, { inc_field: 'skateparkID' });

module.exports = mongoose.model("skatepark", skateparkSchema);