const mongoose = require('mongoose');

const newspaperSchema = new mongoose.Schema({
    name: { type: String, required: true },
    url: { type: String, required: true },
    logo_text: { type: String, default: '' },
    logo_color: { type: String, default: '#000000' },
    country: { type: String, default: 'Global' },
    created_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Newspaper', newspaperSchema);
