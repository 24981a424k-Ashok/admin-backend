const mongoose = require('mongoose');

const advertisementSchema = new mongoose.Schema({
    image_url: { type: String, required: true },
    caption: { type: String, default: '' },
    target_node: { type: String, default: 'Global' },
    created_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Advertisement', advertisementSchema);
