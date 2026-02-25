const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');

router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    // Hardcoded check for multiple admins
    const authorizedEmails = (process.env.ADMIN_EMAIL || '').split(',').map(e => e.trim().toLowerCase());

    if (authorizedEmails.includes(email.trim().toLowerCase()) && password === process.env.ADMIN_PASSWORD) {
        const token = jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: '1d' });
        return res.json({ status: 'success', token, role: 'admin' });
    }

    // If not admin, we might still allow "login" but tag as visitor
    // However the prompt says: "If user is chaparapuashokreddy666@gmail.com -> show both Website & Admin options. If not admin -> go straight to website only"
    // So we just return the role.

    res.json({ status: 'success', token: null, role: 'user' });
});

module.exports = router;
