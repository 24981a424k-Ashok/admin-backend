const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');

router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    
    // Clean up env vars (strip quotes and spaces if user pasted them from .env files)
    const rawEmails = process.env.ADMIN_EMAIL || '';
    const cleanEmails = rawEmails.replace(/['"]/g, ''); // Remove common quote marks
    const authorizedEmails = cleanEmails.split(',').map(e => e.trim().toLowerCase());
    
    const rawPass = process.env.ADMIN_PASSWORD || '';
    const adminPassword = rawPass.replace(/['"]/g, '').trim();

    if (authorizedEmails.includes(email.trim().toLowerCase()) && password === adminPassword) {
        const token = jwt.sign({ email }, process.env.JWT_SECRET || 'static_secret', { expiresIn: '1d' });
        return res.json({ status: 'success', token, role: 'admin' });
    }

    // Diagnostic info (Temporary for debugging)
    const isEmailOk = authorizedEmails.includes(email.trim().toLowerCase());
    const debugMsg = !isEmailOk ? `Email matching failed. Authorized: [${authorizedEmails.join('|')}]` : "Password mismatch";

    res.json({ status: 'success', token: null, role: 'user', debug: debugMsg });
});

router.get('/config-check', (req, res) => {
    res.json({
        raw_emails: process.env.ADMIN_EMAIL,
        password_exists: !!process.env.ADMIN_PASSWORD,
        secret_exists: !!process.env.JWT_SECRET,
        current_time: new Date().toISOString()
    });
});

module.exports = router;
