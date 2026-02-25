const express = require('express');
const router = express.Router();
const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.resolve(__dirname, '../../ai-news-agent/data/news.db');
const db = new Database(dbPath, { timeout: 5000 });

// Create newspapers table if it doesn't exist
db.prepare(`
    CREATE TABLE IF NOT EXISTS newspapers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        url TEXT NOT NULL,
        logo_text TEXT,
        logo_color TEXT,
        country TEXT DEFAULT 'Global',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
`).run();

// Middleware to verify admin (simplified)
const authenticateAdmin = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'Unauthorized' });
    next();
};

// Get all newspapers
router.get('/', (req, res) => {
    try {
        const papers = db.prepare('SELECT * FROM newspapers ORDER BY name ASC').all();
        res.json(papers);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Add newspaper
router.post('/', authenticateAdmin, (req, res) => {
    const { name, url, logo_text, logo_color, country } = req.body;
    try {
        const info = db.prepare('INSERT INTO newspapers (name, url, logo_text, logo_color, country) VALUES (?, ?, ?, ?, ?)')
            .run(name, url, logo_text, logo_color, country || 'Global');
        res.json({ id: info.lastInsertRowid, status: 'success' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Delete newspaper
router.delete('/:id', authenticateAdmin, (req, res) => {
    const { id } = req.params;
    try {
        const result = db.prepare('DELETE FROM newspapers WHERE id = ?').run(Number(id));
        if (result.changes === 0) {
            return res.status(404).json({ error: 'Newspaper not found' });
        }
        res.json({ status: 'success' });
    } catch (err) {
        console.error('Delete Newspaper Error:', err.message);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
