require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const jwt = require('jsonwebtoken');

const app = express();
const PYTHON_API_URL = process.env.PYTHON_API_URL || 'http://localhost:7860';
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey_change_me';

// --- MIDDLEWARE ---
app.use(cors());
app.use(express.json());

// --- TUNNEL BYPASS PROTOCOL ---
// Ensures Vercel skip the Localtunnel 'friendly' splash page
axios.interceptors.request.use(config => {
    config.headers['Bypass-Tunnel-Reminder'] = 'true';
    config.headers['Content-Type'] = 'application/json';
    return config;
});

// Request Logger
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

// --- AUTH MIDDLEWARE ---
const authenticateAdmin = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'System Access Denied: No Token' });
    const token = authHeader.split(' ')[1];
    
    // In production, use jwt.verify(token, JWT_SECRET)
    // For now, accept our Master Brain Token for cloud-to-local testing
    if (token === 'master_brain_token_777') {
        next();
    } else {
        res.status(401).json({ error: 'System Access Denied: Invalid Node Token' });
    }
};

// --- RELAY ROUTES ---

// Health Check
app.get('/', (req, res) => {
    res.json({ status: 'UniIntel Admin Relay Online', node: 'Vercel-Express', sync: 'Active' });
});

// 0. Authentication Relay (Public)
app.post('/api/auth/login', async (req, res) => {
    try {
        const response = await axios.post(`${PYTHON_API_URL}/api/admin/login`, req.body);
        res.json(response.data);
    } catch (err) {
        const status = err.response?.status || 500;
        const errorMsg = err.response?.data?.error || 'Authentication Node Offline';
        res.status(status).json({ error: errorMsg, details: err.message });
    }
});

// 1. Articles Relay
app.get('/api/articles', async (req, res) => {
    try {
        const response = await axios.get(`${PYTHON_API_URL}/api/admin/articles`);
        res.json(response.data);
    } catch (err) {
        res.status(500).json({ error: 'Neural Node Offline', details: err.message });
    }
});

app.post('/api/articles', authenticateAdmin, async (req, res) => {
    try {
        const response = await axios.post(`${PYTHON_API_URL}/api/admin/articles`, req.body);
        res.json(response.data);
    } catch (err) {
        res.status(500).json({ error: 'Injection Protocol Failed', details: err.message });
    }
});

app.delete('/api/articles/:id', authenticateAdmin, async (req, res) => {
    try {
        const response = await axios.delete(`${PYTHON_API_URL}/api/admin/articles/${req.params.id}`);
        res.json(response.data);
    } catch (err) {
        res.status(500).json({ error: 'Purge Protocol Failed', details: err.message });
    }
});

// 2. Advertisements Relay
app.get('/api/ads', async (req, res) => {
    try {
        const response = await axios.get(`${PYTHON_API_URL}/api/admin/ads`);
        res.json(response.data);
    } catch (err) {
        res.status(500).json({ error: 'Campaign Node Offline', details: err.message });
    }
});

app.post('/api/ads', authenticateAdmin, async (req, res) => {
    try {
        const response = await axios.post(`${PYTHON_API_URL}/api/admin/ads`, req.body);
        res.json(response.data);
    } catch (err) {
        res.status(500).json({ error: 'Asset Deployment Failed', details: err.message });
    }
});

app.delete('/api/ads/:id', authenticateAdmin, async (req, res) => {
    try {
        const response = await axios.delete(`${PYTHON_API_URL}/api/admin/ads/${req.params.id}`);
        res.json(response.data);
    } catch (err) {
        res.status(500).json({ error: 'Asset Purge Failed', details: err.message });
    }
});

// 3. System Sync / Intelligence Refresh
app.post('/api/sync-intelligence', authenticateAdmin, async (req, res) => {
    try {
        const response = await axios.post(`${PYTHON_API_URL}/api/admin/refresh-digest`);
        res.json(response.data);
    } catch (err) {
        res.status(500).json({ error: 'Intelligence Sync Failed', details: err.message });
    }
});

// 4. History / Audit Log Proxy
app.get('/api/history', authenticateAdmin, async (req, res) => {
    try {
        const response = await axios.get(`${PYTHON_API_URL}/api/admin/history`);
        res.json(response.data);
    } catch (err) {
        res.status(500).json({ error: 'Audit Trail Offline', details: err.message });
    }
});

// 5. System Parameters / Config Relay
app.get('/api/config', authenticateAdmin, async (req, res) => {
    try {
        const response = await axios.get(`${PYTHON_API_URL}/api/admin/config`);
        res.json(response.data);
    } catch (err) {
        res.status(500).json({ error: 'Config Node Offline', details: err.message });
    }
});

app.post('/api/config', authenticateAdmin, async (req, res) => {
    try {
        const response = await axios.post(`${PYTHON_API_URL}/api/admin/config`, req.body);
        res.json(response.data);
    } catch (err) {
        res.status(500).json({ error: 'Config Update Failed', details: err.message });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`UniIntel Admin Relay listening on port ${PORT}`);
});
