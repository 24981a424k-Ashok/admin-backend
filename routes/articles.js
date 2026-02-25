const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const axios = require('axios');

const PYTHON_API_URL = process.env.PYTHON_API_URL || 'https://uni-intel-ml-innovator2.hf.space';

// Middleware to verify admin token
const authenticateAdmin = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'No token provided' });

    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        res.status(401).json({ error: 'Invalid token' });
    }
};

// Get all articles (proxied from Python backend)
router.get('/', authenticateAdmin, async (req, res) => {
    try {
        const response = await axios.get(`${PYTHON_API_URL}/api/articles`, { timeout: 10000 });
        res.json(response.data);
    } catch (err) {
        console.error('Get Articles Error:', err.message);
        res.status(500).json({ error: 'Failed to fetch articles from intelligence backend', details: err.message });
    }
});

// Delete article (proxied to Python backend)
router.delete('/:id', authenticateAdmin, async (req, res) => {
    const { id } = req.params;
    try {
        const response = await axios.delete(`${PYTHON_API_URL}/api/articles/${id}`, { timeout: 10000 });
        res.json(response.data);
    } catch (err) {
        console.error('Delete Article Error:', err.message);
        res.status(500).json({ error: `Failed to delete article: ${err.message}` });
    }
});

// Refresh live site (trigger digest regeneration)
router.post('/refresh', authenticateAdmin, async (req, res) => {
    try {
        const response = await axios.post(`${PYTHON_API_URL}/api/refresh-digest`, {}, { timeout: 30000 });
        res.json(response.data);
    } catch (err) {
        console.error('Refresh Failed:', err.message);
        res.status(500).json({ error: 'Failed to trigger live site refresh' });
    }
});

module.exports = router;
