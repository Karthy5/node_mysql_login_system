const express = require('express');
const router = express.Router();
const db = require('../config/database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET;

router.get('/register', (req, res) => {
    res.render('register');
});

router.post('/register', (req, res) => {
    const { name, email, password, confirm_password } = req.body;

    db.query('SELECT email FROM users WHERE email = ?', [email], (error, result) => {
        if (error) {
            console.log(error);
        }

        if (result.length > 0) {
            return res.render('register', { message: 'Email already in use!' });
        } else if (password !== confirm_password) {
            return res.render('register', { message: 'Passwords do not match!' });
        }

        bcrypt.hash(password, 10, (err, hashedPassword) => {
            if (err) {
                console.log(err);
                return res.render('register', { message: 'Error hashing password!' });
            }

            db.query('INSERT INTO users SET ?', { name, email, password: hashedPassword }, (error, results) => {
                if (error) {
                    console.log(error);
                    return res.render('register', { message: 'Error registering user!' });
                } else {
                    return res.redirect('/auth/login');
                }
            });
        });
    });
});

router.get('/login', (req, res) => {
    res.render('login');
});

router.post('/login', (req, res) => {
    const { email, password } = req.body;

    db.query('SELECT * FROM users WHERE email = ?', [email], (error, results) => {
        if (error) {
            console.log(error);
            return res.render('login', { message: 'Something went wrong!' });
        }

        if (results.length === 0) {
            return res.render('login', { message: 'Invalid email or password!' });
        }

        const user = results[0];

        bcrypt.compare(password, user.password, (err, isMatch) => {
            if (err) {
                console.log(err);
                return res.render('login', { message: 'Error checking password' });
            }

            if (!isMatch) {
                return res.render('login', { message: 'Invalid email or password!' });
            }

            const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '1h' });

            res.cookie('token', token, { httpOnly: true });

            return res.redirect('/dashboard');
        });
    });
});

router.get('/logout', (req, res) => {
    res.clearCookie('token');
    res.redirect('/');
});

module.exports = router;
