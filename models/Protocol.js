const mongoose = require('mongoose');

const ProtocolSchema = new mongoose.Schema({
    admin_user: { type: String, required: true },
    action: { type: String, required: true }, // 'create', 'update', 'delete', 'sync'
    target_type: { type: String, required: true }, // 'article', 'ad', 'newspaper', 'blueprint'
    target_id: { type: String, required: true },
    details: { type: String },
    timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Protocol', ProtocolSchema);
