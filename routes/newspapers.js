const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');

// In-memory fallback store
const memPapers = new Map();
let memIdCounter = 1;

let Newspaper = null;
try {
    Newspaper = require('../models/Newspaper');
} catch (e) {
    console.warn('Newspaper model not available, using in-memory store');
}

function isMongoConnected() {
    try {
        const mongoose = require('mongoose');
        return mongoose.connection.readyState === 1;
    } catch {
        return false;
    }
}

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
        if (isMongoConnected() && Newspaper) {
            const papers = await Newspaper.find().sort({ name: 1 });
            return res.json(papers);
        }
        const papers = Array.from(memPapers.values()).sort((a, b) => a.name.localeCompare(b.name));
        return res.json(papers);
    } catch (err) {
        console.error('Get newspapers error:', err.message);
        res.json([]);
    }
});

// POST create newspaper (admin only)
router.post('/', authenticateAdmin, async (req, res) => {
    try {
        const { name, url, country, image_url } = req.body;
        if (!name || !url) {
            return res.status(400).json({ error: 'name and url are required' });
        }

        if (isMongoConnected() && Newspaper) {
            const paper = new Newspaper({ name, url, country, image_url });
            await paper.save();
            return res.json({ success: true, paper });
        }

        const id = String(memIdCounter++);
        const paper = { _id: id, name, url, country, image_url, created_at: new Date().toISOString() };
        memPapers.set(id, paper);
        return res.json({ success: true, paper });
    } catch (err) {
        console.error('Create newspaper error:', err.message);
        res.status(500).json({ error: err.message });
    }
});

// DELETE newspaper (admin only)
router.delete('/:id', authenticateAdmin, async (req, res) => {
    try {
        if (isMongoConnected() && Newspaper) {
            await Newspaper.findByIdAndDelete(req.params.id);
            return res.json({ success: true });
        }
        memPapers.delete(req.params.id);
        return res.json({ success: true });
    } catch (err) {
        console.error('Delete newspaper error:', err.message);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
