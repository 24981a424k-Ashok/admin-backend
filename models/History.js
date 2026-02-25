const mongoose = require('mongoose');

const HistorySchema = new mongoose.Schema({
    blueprint_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Blueprint', required: true },
    structure: { type: mongoose.Schema.Types.Mixed, required: true },
    timestamp: { type: Date, default: Date.now },
    action: { type: String, enum: ['save', 'publish', 'undo', 'redo'], default: 'save' }
});

module.exports = mongoose.model('History', HistorySchema);
