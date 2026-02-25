const mongoose = require('mongoose');

const BlueprintSchema = new mongoose.Schema({
    name: { type: String, required: true },
    structure: { type: mongoose.Schema.Types.Mixed, required: true },
    is_published: { type: Boolean, default: false },
    version: { type: Number, default: 1 },
    author: { type: String, default: 'admin' },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now }
});

BlueprintSchema.pre('save', function (next) {
    this.updated_at = Date.now();
    next();
});

module.exports = mongoose.model('Blueprint', BlueprintSchema);
