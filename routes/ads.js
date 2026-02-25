const express = require('express');
const router = express.Router();
const Advertisement = require('../models/Advertisement');

// Middleware to verify admin
const authenticateAdmin = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'Unauthorized' });
    next();
};

// Get all ads (public - used by AI news portal to sync)
router.get('/', async (req, res) => {
    try {
        const ads = await Advertisement.find().sort({ created_at: -1 }).limit(10);
        res.json(ads);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Add new ad
router.post('/', authenticateAdmin, async (req, res) => {
    const { image_url, caption, target_node } = req.body;
    try {
        const ad = new Advertisement({ image_url, caption, target_node: target_node || 'Global' });
        await ad.save();
        res.json({ id: ad._id, status: 'success' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Delete ad
router.delete('/:id', authenticateAdmin, async (req, res) => {
    const { id } = req.params;
    try {
        const result = await Advertisement.findByIdAndDelete(id);
        if (!result) return res.status(404).json({ error: 'Advertisement not found' });
        res.json({ status: 'success' });
    } catch (err) {
        console.error('Delete Ad Error:', err.message);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
