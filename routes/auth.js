const express = require('express');
const router = express.Router();
const db = require('../config/database'); // MySQL database

// Change Password Route
router.post('/change-password', (req, res) => {
    const { current_password, new_password, confirm_new_password } = req.body;

    const user = req.session.user; // Get the logged-in user from session

    if (!user) {
        return res.redirect('/auth/login'); // If the user is not logged in, redirect to login
    }

    if (new_password !== confirm_new_password) {
        return res.render('dashboard', { 
            user: user, 
            message: 'New passwords do not match!' 
        });
    }

    // Query to get the user's current hashed password from the database
    db.query('SELECT password FROM users WHERE email = ?', [user.email], (error, results) => {
        if (error) {
            console.log(error);
            return res.render('dashboard', { user: user, message: 'Something went wrong!' });
        }

        const storedPassword = results[0].password;

        // Compare current password with the stored hashed password
        bcrypt.compare(current_password, storedPassword, (err, isMatch) => {
            if (err) {
                console.log(err);
                return res.render('dashboard', { user: user, message: 'Error checking password' });
            }

            if (!isMatch) {
                return res.render('dashboard', { 
                    user: user, 
                    message: 'Current password is incorrect!' 
                });
            }

            // Hash the new password before saving it to the database
            bcrypt.hash(new_password, 10, (err, hashedPassword) => {
                if (err) {
                    console.log(err);
                    return res.render('dashboard', { user: user, message: 'Error hashing password' });
                }

                // Update the user's password in the database
                db.query('UPDATE users SET password = ? WHERE email = ?', [hashedPassword, user.email], (error, results) => {
                    if (error) {
                        console.log(error);
                        return res.render('dashboard', { user: user, message: 'Error updating password' });
                    }

                    return res.render('dashboard', { 
                        user: user, 
                        message: 'Password updated successfully!' 
                    });
                });
            });
        });
    });
});

// Register route
router.get('/register', (req, res) => {
    res.render('register'); // Ensure this renders the register page properly
});

router.post('/register', (req, res) => {
    const { name, email, password, confirm_password } = req.body;

    // Check if email already exists
    db.query('SELECT email FROM users WHERE email = ?', [email], (error, result) => {
        if (error) {
            console.log(error);
        }

        if (result.length > 0) {
            return res.render('register', {
                message: 'Email already in use!'
            });
        } else if (password !== confirm_password) {
            return res.render('register', {
                message: 'Passwords do not match!'
            });
        }

        // Insert new user into the database
        db.query('INSERT INTO users SET ?', { name, email, password }, (error, results) => {
            if (error) {
                console.log(error);
            } else {
                req.session.user = { name, email };
                return res.redirect('/auth/dashboard');
            }
        });
    });
});

// Login route
router.get('/login', (req, res) => {
    res.render('login'); // Ensure this renders the login page
});

router.post('/login', (req, res) => {
    const { email, password } = req.body;

    // Check if user exists
    db.query('SELECT * FROM users WHERE email = ?', [email], (error, results) => {
        if (error) {
            console.log(error);
            return res.render('login', { message: 'Something went wrong!' });
        }

        if (results.length === 0 || password !== results[0].password) {
            return res.render('login', { message: 'Invalid email or password!' });
        }

        // Successful login, create session
        req.session.user = results[0];
        res.redirect('/auth/dashboard');
    });
});

// Dashboard route
router.get('/dashboard', (req, res) => {
    if (!req.session.user) {
        return res.redirect('/auth/login'); // Redirect to login if not logged in
    }
    res.render('dashboard', { user: req.session.user });
});

// Update user details
router.post('/update', (req, res) => {
    const { name, email } = req.body;
    const userId = req.session.user.id;

    // Update user info in database
    db.query('UPDATE users SET name = ?, email = ? WHERE id = ?', [name, email, userId], (error, results) => {
        if (error) {
            console.log(error);
            return res.render('dashboard', { user: req.session.user, message: 'Something went wrong!' });
        }

        // Update the session with new user info
        req.session.user.name = name;
        req.session.user.email = email;

        return res.render('dashboard', { user: req.session.user, message: 'Account details updated successfully!' });
    });
});

// Delete user account
router.post('/delete', (req, res) => {
    const userId = req.session.user.id;

    // Delete user from the database
    db.query('DELETE FROM users WHERE id = ?', [userId], (error, results) => {
        if (error) {
            console.log(error);
            return res.render('dashboard', { user: req.session.user, message: 'Something went wrong!' });
        }

        // Destroy the session and log the user out
        req.session.destroy((err) => {
            if (err) {
                console.log(err);
            }
            return res.redirect('/');
        });
    });
});

// Logout route
router.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.log(err);
        }
        res.redirect('/');
    });
});

module.exports = router;
