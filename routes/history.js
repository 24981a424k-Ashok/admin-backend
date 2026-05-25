const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const axios = require('axios');

const PYTHON_API_URL = (process.env.PYTHON_API_URL || 'https://finalbackend-production-9218.up.railway.app').replace(/\/$/, '');

// Auth Middleware
const authenticateAdmin = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'No token provided' });
    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'supersecretkey_change_me');
        req.user = decoded;
        next();
    } catch (err) { 
        return res.status(401).json({ error: 'Invalid token' }); 
    }
};

const pyHeaders = () => ({
    headers: { 'Authorization': `Bearer ${process.env.ADMIN_JWT_SECRET || ''}`, 'Content-Type': 'application/json' }
});

// GET full history from Python backend (PostgreSQL database)
router.get('/', authenticateAdmin, async (req, res) => {
    try {
        const r = await axios.get(`${PYTHON_API_URL}/api/admin/history`, { ...pyHeaders(), timeout: 10000 });
        res.json(r.data);
    } catch (err) {
        console.error('Failed to fetch history from Python backend:', err.message);
        res.status(500).json({ error: 'Failed to fetch protocol history' });
    }
});

module.exports = router;

