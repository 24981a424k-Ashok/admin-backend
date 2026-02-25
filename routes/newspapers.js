const express = require('express');
const router = express.Router();
const Newspaper = require('../models/Newspaper');

// Middleware to verify admin
const authenticateAdmin = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'Unauthorized' });
    next();
};

// Get all newspapers (public)
router.get('/', async (req, res) => {
    try {
        const papers = await Newspaper.find().sort({ name: 1 });
        res.json(papers);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Add newspaper
router.post('/', authenticateAdmin, async (req, res) => {
    const { name, url, logo_text, logo_color, country } = req.body;
    try {
        const paper = new Newspaper({ name, url, logo_text, logo_color, country: country || 'Global' });
        await paper.save();
        res.json({ id: paper._id, status: 'success' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Delete newspaper
router.delete('/:id', authenticateAdmin, async (req, res) => {
    const { id } = req.params;
    try {
        const result = await Newspaper.findByIdAndDelete(id);
        if (!result) return res.status(404).json({ error: 'Newspaper not found' });
        res.json({ status: 'success' });
    } catch (err) {
        console.error('Delete Newspaper Error:', err.message);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
