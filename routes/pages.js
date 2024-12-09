const express = require('express');
const router = express.Router();

// Home page route
router.get('/', (req, res) => {
    res.render('index');
});

// Register page route
router.get('/register', (req, res) => {
    res.render('register'); // Renders the register form
});

// Login page route
router.get('/login', (req, res) => {
    res.render('login'); // Renders the login form
});

// Render the dashboard page
router.get('/dashboard', (req, res) => {
    if (!req.session.user) {
        return res.redirect('/auth/login'); // Redirect to login if the user is not logged in
    }

    const user = req.session.user;
    res.render('dashboard', { user: user });
});

module.exports = router;

