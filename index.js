require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const blueprintRoutes = require('./routes/blueprints');
const articleRoutes = require('./routes/articles');
const adRoutes = require('./routes/ads');
const newspaperRoutes = require('./routes/newspapers');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/blueprints', blueprintRoutes);
app.use('/api/articles', articleRoutes);
app.use('/api/ads', adRoutes);
app.use('/api/newspapers', newspaperRoutes);
const axios = require('axios');
const jwt = require('jsonwebtoken');

// Global Auth Middleware for index routes
const authenticateAdmin = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'No token provided' });
    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) { res.status(401).json({ error: 'Invalid token' }); }
};

app.post('/api/sync-intelligence', authenticateAdmin, async (req, res) => {
    try {
        const pythonApiUrl = process.env.PYTHON_API_URL || 'http://localhost:8000';
        const response = await axios.post(`${pythonApiUrl}/api/refresh-digest`);
        res.json(response.data);
    } catch (err) {
        console.error('Sync Failed:', err.message);
        res.status(500).json({ error: 'Failed to trigger intelligence sync' });
    }
});

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('Could not connect to MongoDB', err));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Admin Backend running on port ${PORT}`);
});
