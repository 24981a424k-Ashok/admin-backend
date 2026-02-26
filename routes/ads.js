const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const axios = require('axios');

const PYTHON_API_URL = process.env.PYTHON_API_URL || 'https://uni-intel-ml-innovator2.hf.space';

// Middleware to verify admin
const authenticateAdmin = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'Unauthorized' });
    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'supersecretkey_change_me');
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(401).json({ error: 'Invalid token' });
    }
};

// GET all ads (public)
router.get('/', async (req, res) => {
    try {
        const response = await axios.get(`${PYTHON_API_URL}/api/ads`, { timeout: 10000 });
        return res.json(response.data);
    } catch (err) {
        console.error('Get ads error:', err.message);
        res.json([]); // Always return empty array, never 500
    }
});

// POST create ad (admin only)
router.post('/', authenticateAdmin, async (req, res) => {
    try {
        const { image_url, caption } = req.body;
        if (!image_url || !caption) {
            return res.status(400).json({ error: 'image_url and caption are required' });
        }

        const response = await axios.post(`${PYTHON_API_URL}/api/ads`, req.body, { timeout: 10000 });

        return res.json(response.data);
    } catch (err) {
        console.error('Create ad error:', err.message);
        res.status(500).json({ error: err.message });
    }
});

// DELETE ad (admin only)
router.delete('/:id', authenticateAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const response = await axios.delete(`${PYTHON_API_URL}/api/ads/${id}`, { timeout: 10000 });
        return res.json(response.data);
    } catch (err) {
        console.error('Delete ad error:', err.message);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
