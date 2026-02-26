const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const axios = require('axios');

const PYTHON_API_URL = process.env.PYTHON_API_URL || 'https://uni-intel-ml-innovator2.hf.space';

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

// GET all newspapers (public)
router.get('/', async (req, res) => {
    try {
        const response = await axios.get(`${PYTHON_API_URL}/api/newspapers`, { timeout: 10000 });
        return res.json(response.data);
    } catch (err) {
        console.error('Get newspapers error:', err.message);
        res.json([]);
    }
});

// POST create newspaper (admin only)
router.post('/', authenticateAdmin, async (req, res) => {
    try {
        const { name, url, country, logo_text, logo_color } = req.body;
        if (!name || !url) {
            return res.status(400).json({ error: 'name and url are required' });
        }

        const response = await axios.post(`${PYTHON_API_URL}/api/newspapers`, {
            name,
            url,
            country,
            logo_text,
            logo_color
        }, { timeout: 10000 });

        return res.json(response.data);
    } catch (err) {
        console.error('Create newspaper error:', err.message);
        res.status(500).json({ error: err.message });
    }
});

// DELETE newspaper (admin only)
router.delete('/:id', authenticateAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const response = await axios.delete(`${PYTHON_API_URL}/api/newspapers/${id}`, { timeout: 10000 });
        return res.json(response.data);
    } catch (err) {
        console.error('Delete newspaper error:', err.message);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
