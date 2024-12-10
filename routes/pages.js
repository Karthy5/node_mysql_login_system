const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET;
const db = require('../config/database');

router.get('/', (req, res) => {
    res.render('index');
});

router.get('/register', (req, res) => {
    res.render('register');
});

router.get('/login', (req, res) => {
    res.render('login');
});

router.get('/dashboard', (req, res) => {
    const token = req.cookies.token;

    if (!token) {
        return res.redirect('/auth/login');
    }

    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.redirect('/auth/login');
        }

        db.query('SELECT * FROM users WHERE id = ?', [decoded.id], (error, results) => {
            if (error || results.length === 0) {
                return res.redirect('/auth/login');
            }

            const user = results[0];
            res.render('dashboard', { user: user });
        });
    });
});

module.exports = router;
