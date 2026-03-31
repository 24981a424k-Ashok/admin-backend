const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const axios = require('axios');
const Protocol = require('../models/Protocol');

const PYTHON_API_URL = process.env.PYTHON_API_URL || 'https://uni12345-ai-news1.hf.space';
// Ensure the URL doesn't have a trailing slash for consistency
const API_BASE = PYTHON_API_URL.endsWith('/') ? PYTHON_API_URL.slice(0, -1) : PYTHON_API_URL;

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
        const { category } = req.query;
        let url = `${API_BASE}/api/articles`;
        if (category) url += `?category=${encodeURIComponent(category)}`;
        
        const response = await axios.get(url, { timeout: 10000 });
        res.json(response.data);
    } catch (err) {
        console.error('Get Articles Error:', err.message);
        res.status(500).json({ error: 'Failed to fetch articles from intelligence backend', details: err.message });
    }
});

// Create manual student article (proxied to Python backend)
router.post('/student/articles', authenticateAdmin, async (req, res) => {
    try {
        const response = await axios.post(`${API_BASE}/api/student/articles`, req.body, { timeout: 10000 });
        
        // Log protocol
        try {
            const log = new Protocol({
                admin_user: req.user.email || 'Admin',
                action: 'create',
                target_type: 'article',
                target_id: response.data?.article?.id?.toString() || 'unknown',
                details: `Manually added student article: ${req.body.title}`
            });
            await log.save();
        } catch (le) { console.error('Protocol Log Error:', le.message); }

        res.json(response.data);
    } catch (err) {
        console.error('Create Student Article Error:', err.message);
        res.status(500).json({ error: `Failed to create student article: ${err.message}` });
    }
});

// Delete article (proxied to Python backend)
router.delete('/:id', authenticateAdmin, async (req, res) => {
    const { id } = req.params;
    try {
        const response = await axios.delete(`${API_BASE}/api/articles/${id}`, { timeout: 10000 });
        
        // Log protocol
        try {
            const log = new Protocol({
                admin_user: req.user.email || 'Admin',
                action: 'delete',
                target_type: 'article',
                target_id: id,
                details: `Deleted intelligence asset node #${id}`
            });
            await log.save();
        } catch (le) { console.error('Protocol Log Error:', le.message); }

        res.json(response.data);
    } catch (err) {
        console.error('Delete Article Error:', err.message);
        res.status(500).json({ error: `Failed to delete article: ${err.message}` });
    }
});

// Update article (proxied to Python backend)
router.put('/:id', authenticateAdmin, async (req, res) => {
    const { id } = req.params;
    try {
        const response = await axios.put(`${API_BASE}/api/articles/${id}`, req.body, { timeout: 10000 });
        
        // Log protocol
        try {
            const log = new Protocol({
                admin_user: req.user.email || 'Admin',
                action: 'update',
                target_type: 'article',
                target_id: id,
                details: `Updated intelligence asset node #${id}: ${req.body.title}`
            });
            await log.save();
        } catch (le) { console.error('Protocol Log Error:', le.message); }

        res.json(response.data);
    } catch (err) {
        console.error('Update Article Error:', err.message);
        res.status(500).json({ error: `Failed to update article: ${err.message}` });
    }
});

// Refresh live site (trigger digest regeneration)
router.post('/refresh', authenticateAdmin, async (req, res) => {
    try {
        const response = await axios.post(`${API_BASE}/api/refresh-digest`, {}, { timeout: 30000 });
        res.json(response.data);
    } catch (err) {
        console.error('Refresh Failed:', err.message);
        res.status(500).json({ error: 'Failed to trigger live site refresh' });
    }
});

module.exports = router;
