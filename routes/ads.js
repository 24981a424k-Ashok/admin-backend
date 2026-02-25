const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');

// In-memory fallback store (used when MongoDB is not available)
const memAds = new Map();
let memIdCounter = 1;

// Try to require MongoDB model, fallback to null
let Advertisement = null;
try {
    Advertisement = require('../models/Advertisement');
} catch (e) {
    console.warn('Advertisement model not available, using in-memory store');
}

// Mongoose connection check helper
function isMongoConnected() {
    try {
        const mongoose = require('mongoose');
        return mongoose.connection.readyState === 1;
    } catch {
        return false;
    }
}

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
        if (isMongoConnected() && Advertisement) {
            const ads = await Advertisement.find().sort({ created_at: -1 }).limit(10);
            return res.json(ads);
        }
        // In-memory fallback
        const ads = Array.from(memAds.values()).slice(-10).reverse();
        return res.json(ads);
    } catch (err) {
        console.error('Get ads error:', err.message);
        res.json([]); // Always return empty array, never 500
    }
});

// POST create ad (admin only)
router.post('/', authenticateAdmin, async (req, res) => {
    try {
        const { image_url, caption, target_node } = req.body;
        if (!image_url || !caption) {
            return res.status(400).json({ error: 'image_url and caption are required' });
        }

        if (isMongoConnected() && Advertisement) {
            const ad = new Advertisement({ image_url, caption, target_node });
            await ad.save();
            return res.json({ success: true, ad });
        }

        // In-memory fallback
        const id = String(memIdCounter++);
        const ad = { _id: id, image_url, caption, target_node, created_at: new Date().toISOString() };
        memAds.set(id, ad);
        return res.json({ success: true, ad });
    } catch (err) {
        console.error('Create ad error:', err.message);
        res.status(500).json({ error: err.message });
    }
});

// DELETE ad (admin only)
router.delete('/:id', authenticateAdmin, async (req, res) => {
    try {
        if (isMongoConnected() && Advertisement) {
            await Advertisement.findByIdAndDelete(req.params.id);
            return res.json({ success: true });
        }
        // In-memory fallback
        memAds.delete(req.params.id);
        return res.json({ success: true });
    } catch (err) {
        console.error('Delete ad error:', err.message);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
