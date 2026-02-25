const express = require('express');
const router = express.Router();
const Database = require('better-sqlite3');
const path = require('path');
const jwt = require('jsonwebtoken');
const axios = require('axios');

const dbPath = path.resolve(__dirname, '../../ai-news-agent/data/news.db');
const db = new Database(dbPath, { timeout: 5000 });

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

// Get all articles
router.get('/', authenticateAdmin, (req, res) => {
    try {
        const articles = db.prepare('SELECT * FROM verified_news ORDER BY published_at DESC').all();
        // Parse JSON fields
        const processedArticles = articles.map(art => ({
            ...art,
            summary_bullets: art.summary_bullets ? JSON.parse(art.summary_bullets) : [],
            impact_tags: art.impact_tags ? JSON.parse(art.impact_tags) : [],
            analysis: art.analysis ? JSON.parse(art.analysis) : {}
        }));
        res.json(processedArticles);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Create article
router.post('/', authenticateAdmin, (req, res) => {
    const {
        title, content, summary_bullets, impact_tags, bias_rating,
        category, country, credibility_score, impact_score,
        why_it_matters, who_is_affected, sentiment,
        analysis, short_term_impact, long_term_impact
    } = req.body;

    try {
        const stmt = db.prepare(`
            INSERT INTO verified_news (
                title, content, summary_bullets, impact_tags, bias_rating,
                category, country, credibility_score, impact_score,
                why_it_matters, who_is_affected, sentiment, 
                analysis, short_term_impact, long_term_impact,
                published_at, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
        const result = stmt.run(
            title,
            content,
            JSON.stringify(summary_bullets || []),
            JSON.stringify(impact_tags || []),
            bias_rating,
            category,
            country,
            credibility_score || 0.9,
            impact_score || 5,
            why_it_matters,
            who_is_affected,
            sentiment || 'Neutral',
            JSON.stringify(analysis || {}),
            short_term_impact || '',
            long_term_impact || '',
            now,
            now
        );

        res.status(201).json({ id: result.lastInsertRowid });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update article
router.put('/:id', authenticateAdmin, (req, res) => {
    const { id } = req.params;
    const {
        title, content, summary_bullets, impact_tags, bias_rating,
        category, country, credibility_score, impact_score,
        why_it_matters, who_is_affected, sentiment,
        analysis, short_term_impact, long_term_impact
    } = req.body;

    try {
        const stmt = db.prepare(`
            UPDATE verified_news SET
                title = ?, content = ?, summary_bullets = ?, impact_tags = ?, 
                bias_rating = ?, category = ?, country = ?, credibility_score = ?, 
                impact_score = ?, why_it_matters = ?, who_is_affected = ?, sentiment = ?,
                analysis = ?, short_term_impact = ?, long_term_impact = ?
            WHERE id = ?
        `);

        stmt.run(
            title,
            content,
            JSON.stringify(summary_bullets || []),
            JSON.stringify(impact_tags || []),
            bias_rating,
            category,
            country,
            credibility_score,
            impact_score,
            why_it_matters,
            who_is_affected,
            sentiment,
            JSON.stringify(analysis || {}),
            short_term_impact,
            long_term_impact,
            id
        );

        res.json({ status: 'success' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Delete article
router.delete('/:id', authenticateAdmin, (req, res) => {
    const { id } = req.params;
    const articleId = Number(id);

    try {
        // Use a transaction for atomic deletion
        const deleteTransaction = db.transaction(() => {
            // 1. Delete from dependent tables first
            db.prepare('DELETE FROM breaking_news WHERE verified_news_id = ?').run(articleId);
            db.prepare('DELETE FROM saved_articles WHERE news_id = ?').run(articleId);
            db.prepare('DELETE FROM read_history WHERE news_id = ?').run(articleId);

            // 2. Finally delete from verified_news
            return db.prepare('DELETE FROM verified_news WHERE id = ?').run(articleId);
        });

        const result = deleteTransaction();

        if (result.changes === 0) {
            return res.status(404).json({ error: 'Article not found in database' });
        }
        res.json({ status: 'success' });
    } catch (err) {
        console.error('Delete Error:', err.message);
        res.status(500).json({ error: `Failed to delete article: ${err.message}` });
    }
});

// Refresh live site (Proxy to Python backend)
router.post('/refresh', authenticateAdmin, async (req, res) => {
    try {
        const pythonApiUrl = process.env.PYTHON_API_URL || 'http://localhost:8000';
        const response = await axios.post(`${pythonApiUrl}/api/refresh-digest`);
        res.json(response.data);
    } catch (err) {
        console.error('Refresh Failed:', err.message);
        res.status(500).json({ error: 'Failed to trigger live site refresh' });
    }
});

module.exports = router;
