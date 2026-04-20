require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

const app = express();
const PYTHON_API_URL = (process.env.PYTHON_API_URL || 'http://uniarcb-production.up.railway.app').replace(/\/$/, '');
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey_change_me';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || '';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '';

// Connect MongoDB for blueprints/history (optional)
if (process.env.MONGODB_URI && process.env.MONGODB_URI !== 'supersecretkey_change_me') {
    mongoose.connect(process.env.MONGODB_URI).catch(e => console.warn('[MongoDB] Connection skipped:', e.message));
}

// Import sub-routers
const blueprintRoutes = require('./routes/blueprints');
const historyRoutes = require('./routes/history');

// --- MIDDLEWARE ---
app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '10mb' }));

// Tunnel bypass header for any localtunnel proxies
axios.defaults.headers.common['Bypass-Tunnel-Reminder'] = 'true';

// Request Logger
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

// --- AUTH MIDDLEWARE ---
const authenticateAdmin = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'No token provided' });
    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(401).json({ error: 'Invalid token' });
    }
};

// Build authenticated axios config for Python backend
const pyHeaders = (adminToken) => ({
    headers: { 'Authorization': `Bearer ${adminToken || process.env.ADMIN_JWT_SECRET || ''}`, 'Content-Type': 'application/json' }
});

// --- HEALTH CHECK ---
app.get('/', (req, res) => {
    res.json({ status: 'UniIntel Admin Relay Online', backend: PYTHON_API_URL, node: 'Vercel-Express' });
});

// --- AUTH ROUTE (Public) ---
app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body || {};
    const rawEmails = ADMIN_EMAIL.replace(/['"]/g, '');
    const authorized = rawEmails.split(',').map(e => e.trim().toLowerCase());
    const cleanPass = ADMIN_PASSWORD.replace(/['"]/g, '').trim();

    if (authorized.includes((email || '').trim().toLowerCase()) && password === cleanPass) {
        const token = jwt.sign({ email }, JWT_SECRET, { expiresIn: '7d' });
        return res.json({ status: 'success', token, role: 'admin' });
    }
    res.status(401).json({ status: 'error', error: 'Invalid credentials' });
});

// ============================================================
// ARTICLES — Full CRUD Relay
// ============================================================
app.get('/api/articles', authenticateAdmin, async (req, res) => {
    try {
        const { category } = req.query;
        let url = `${PYTHON_API_URL}/api/admin/articles`;
        if (category) url += `?category=${encodeURIComponent(category)}`;
        const r = await axios.get(url, { ...pyHeaders(req.headers['x-admin-token']), timeout: 15000 });
        res.json(r.data);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch articles', details: err.message });
    }
});

app.post('/api/articles', authenticateAdmin, async (req, res) => {
    try {
        const r = await axios.post(`${PYTHON_API_URL}/api/admin/articles`, req.body, { ...pyHeaders(), timeout: 15000 });
        res.json(r.data);
    } catch (err) {
        res.status(500).json({ error: 'Failed to create article', details: err.message });
    }
});

app.put('/api/articles/:id', authenticateAdmin, async (req, res) => {
    try {
        const r = await axios.put(`${PYTHON_API_URL}/api/admin/articles/${req.params.id}`, req.body, { ...pyHeaders(), timeout: 15000 });
        res.json(r.data);
    } catch (err) {
        res.status(500).json({ error: 'Failed to update article', details: err.message });
    }
});

app.delete('/api/articles/:id', authenticateAdmin, async (req, res) => {
    try {
        const r = await axios.delete(`${PYTHON_API_URL}/api/admin/articles/${req.params.id}`, { ...pyHeaders(), timeout: 15000 });
        res.json(r.data);
    } catch (err) {
        res.status(500).json({ error: 'Failed to delete article', details: err.message });
    }
});

// ============================================================
// ADS — Full CRUD Relay
// ============================================================
app.get('/api/ads', authenticateAdmin, async (req, res) => {
    try {
        const r = await axios.get(`${PYTHON_API_URL}/api/admin/ads`, { ...pyHeaders(), timeout: 15000 });
        res.json(r.data);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch ads', details: err.message });
    }
});

app.post('/api/ads', authenticateAdmin, async (req, res) => {
    try {
        const r = await axios.post(`${PYTHON_API_URL}/api/admin/ads`, req.body, { ...pyHeaders(), timeout: 15000 });
        res.json(r.data);
    } catch (err) {
        res.status(500).json({ error: 'Failed to create ad', details: err.message });
    }
});

app.put('/api/ads/:id', authenticateAdmin, async (req, res) => {
    try {
        const r = await axios.put(`${PYTHON_API_URL}/api/admin/ads/${req.params.id}`, req.body, { ...pyHeaders(), timeout: 15000 });
        res.json(r.data);
    } catch (err) {
        res.status(500).json({ error: 'Failed to update ad', details: err.message });
    }
});

app.delete('/api/ads/:id', authenticateAdmin, async (req, res) => {
    try {
        const r = await axios.delete(`${PYTHON_API_URL}/api/admin/ads/${req.params.id}`, { ...pyHeaders(), timeout: 15000 });
        res.json(r.data);
    } catch (err) {
        res.status(500).json({ error: 'Failed to delete ad', details: err.message });
    }
});

// ============================================================
// NEWSPAPERS — Full CRUD Relay
// ============================================================
app.get('/api/newspapers', authenticateAdmin, async (req, res) => {
    try {
        const r = await axios.get(`${PYTHON_API_URL}/api/admin/newspapers`, { ...pyHeaders(), timeout: 15000 });
        res.json(r.data);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch newspapers', details: err.message });
    }
});

app.post('/api/newspapers', authenticateAdmin, async (req, res) => {
    try {
        const r = await axios.post(`${PYTHON_API_URL}/api/admin/newspapers`, req.body, { ...pyHeaders(), timeout: 15000 });
        res.json(r.data);
    } catch (err) {
        res.status(500).json({ error: 'Failed to create newspaper', details: err.message });
    }
});

app.put('/api/newspapers/:id', authenticateAdmin, async (req, res) => {
    try {
        const r = await axios.put(`${PYTHON_API_URL}/api/admin/newspapers/${req.params.id}`, req.body, { ...pyHeaders(), timeout: 15000 });
        res.json(r.data);
    } catch (err) {
        res.status(500).json({ error: 'Failed to update newspaper', details: err.message });
    }
});

app.delete('/api/newspapers/:id', authenticateAdmin, async (req, res) => {
    try {
        const r = await axios.delete(`${PYTHON_API_URL}/api/admin/newspapers/${req.params.id}`, { ...pyHeaders(), timeout: 15000 });
        res.json(r.data);
    } catch (err) {
        res.status(500).json({ error: 'Failed to delete newspaper', details: err.message });
    }
});

// ============================================================
// PIPELINE CONTROL
// ============================================================
app.post('/api/pipeline/trigger-ingest', authenticateAdmin, async (req, res) => {
    try {
        const r = await axios.post(`${PYTHON_API_URL}/api/admin/trigger-ingest`, {}, { ...pyHeaders(), timeout: 30000 });
        res.json(r.data);
    } catch (err) {
        res.status(500).json({ error: 'Ingest trigger failed', details: err.message });
    }
});

app.post('/api/pipeline/refresh-digest', authenticateAdmin, async (req, res) => {
    try {
        const r = await axios.post(`${PYTHON_API_URL}/api/admin/refresh-digest`, {}, { ...pyHeaders(), timeout: 30000 });
        res.json(r.data);
    } catch (err) {
        res.status(500).json({ error: 'Refresh failed', details: err.message });
    }
});

app.post('/api/pipeline/clear-cache', authenticateAdmin, async (req, res) => {
    try {
        const r = await axios.post(`${PYTHON_API_URL}/api/admin/clear-cache`, {}, { ...pyHeaders(), timeout: 15000 });
        res.json(r.data);
    } catch (err) {
        res.status(500).json({ error: 'Cache clear failed', details: err.message });
    }
});

app.get('/api/pipeline/keypool-status', authenticateAdmin, async (req, res) => {
    try {
        const r = await axios.get(`${PYTHON_API_URL}/api/admin/keypool-status`, { ...pyHeaders(), timeout: 10000 });
        res.json(r.data);
    } catch (err) {
        res.status(500).json({ error: 'Key pool status unavailable', details: err.message });
    }
});

app.get('/api/pipeline/health', async (req, res) => {
    try {
        const r = await axios.get(`${PYTHON_API_URL}/api/v2/system/health`, { timeout: 10000 });
        res.json(r.data);
    } catch (err) {
        res.status(500).json({ error: 'Backend unreachable', details: err.message });
    }
});

// ============================================================
// SYSTEM CONFIG + HISTORY + SYNC (Legacy relay)
// ============================================================
app.get('/api/config', authenticateAdmin, async (req, res) => {
    try {
        const r = await axios.get(`${PYTHON_API_URL}/api/admin/config`, { ...pyHeaders(), timeout: 10000 });
        // Return as array for SystemSettings compat
        const data = r.data;
        const arr = Object.entries(data).map(([config_key, config_value]) => ({ config_key, config_value }));
        res.json(arr);
    } catch (err) {
        res.status(500).json({ error: 'Config unavailable', details: err.message });
    }
});

app.post('/api/config', authenticateAdmin, async (req, res) => {
    try {
        const { config_key, config_value } = req.body;
        const r = await axios.post(`${PYTHON_API_URL}/api/admin/config`, { [config_key]: config_value }, { ...pyHeaders(), timeout: 10000 });
        res.json(r.data);
    } catch (err) {
        res.status(500).json({ error: 'Config update failed', details: err.message });
    }
});

app.get('/api/history', authenticateAdmin, async (req, res) => {
    try {
        const r = await axios.get(`${PYTHON_API_URL}/api/admin/history`, { ...pyHeaders(), timeout: 10000 });
        res.json(r.data);
    } catch (err) {
        res.status(500).json({ error: 'History unavailable', details: err.message });
    }
});

app.post('/api/sync-intelligence', authenticateAdmin, async (req, res) => {
    try {
        const r = await axios.post(`${PYTHON_API_URL}/api/admin/refresh-digest`, {}, { ...pyHeaders(), timeout: 30000 });
        res.json(r.data);
    } catch (err) {
        res.status(500).json({ error: 'Sync failed', details: err.message });
    }
});

// Stats endpoint for dashboard
app.get('/api/stats', authenticateAdmin, async (req, res) => {
    try {
        const r = await axios.get(`${PYTHON_API_URL}/api/admin/stats`, { ...pyHeaders(), timeout: 10000 });
        res.json(r.data);
    } catch (err) {
        res.status(500).json({ error: 'Stats unavailable', details: err.message });
    }
});

// ============================================================
// BLUEPRINTS + HISTORY (MongoDB-backed sub-routers)
// ============================================================
app.use('/api/blueprints', blueprintRoutes);
app.use('/api/history', historyRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`UniIntel Admin Relay on port ${PORT} → ${PYTHON_API_URL}`));
