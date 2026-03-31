const express = require('express');
const router = express.Router();
const Protocol = require('../models/Protocol');
const jwt = require('jsonwebtoken');

// Auth Middleware
const authenticateAdmin = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'No token provided' });
    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
        req.user = decoded;
        next();
    } catch (err) { res.status(401).json({ error: 'Invalid token' }); }
};

// GET full history
router.get('/', authenticateAdmin, async (req, res) => {
    try {
        const history = await Protocol.find().sort({ timestamp: -1 }).limit(100);
        res.json(history);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch protocol history' });
    }
});

// Helper for other routes to log actions
router.logAction = async (adminId, action, type, id, details) => {
    try {
        const record = new Protocol({
            admin_user: adminId,
            action: action,
            target_type: type,
            target_id: id,
            details: details
        });
        await record.save();
    } catch (err) {
        console.error('Logging failed:', err.message);
    }
};

module.exports = router;
