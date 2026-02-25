const express = require('express');
const router = express.Router();
const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.resolve(__dirname, '../../ai-news-agent/data/news.db');
const db = new Database(dbPath, { timeout: 5000 });

// Create advertisements table if it doesn't exist
db.prepare(`
    CREATE TABLE IF NOT EXISTS advertisements (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        image_url TEXT NOT NULL,
        caption TEXT,
        target_node TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
`).run();

// Middleware to verify admin (simplified check - checks if token exists)
const authenticateAdmin = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'Unauthorized' });
    next();
};

// Get all ads
router.get('/', (req, res) => {
    try {
        const ads = db.prepare('SELECT * FROM advertisements ORDER BY created_at DESC').all();
        res.json(ads);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Add new ad
router.post('/', authenticateAdmin, (req, res) => {
    const { image_url, caption, target_node } = req.body;
    try {
        const info = db.prepare('INSERT INTO advertisements (image_url, caption, target_node) VALUES (?, ?, ?)')
            .run(image_url, caption, target_node || 'Global');
        res.json({ id: info.lastInsertRowid, status: 'success' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Delete ad
router.delete('/:id', authenticateAdmin, (req, res) => {
    const { id } = req.params;
    try {
        const result = db.prepare('DELETE FROM advertisements WHERE id = ?').run(Number(id));
        if (result.changes === 0) {
            return res.status(404).json({ error: 'Advertisement not found' });
        }
        res.json({ status: 'success' });
    } catch (err) {
        console.error('Delete Ad Error:', err.message);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
