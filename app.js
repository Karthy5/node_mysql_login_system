const express = require('express');
const mysql = require('mysql');
const path = require('path');
const dotenv = require('dotenv');
const session = require('express-session');
const app = express();

dotenv.config({ path: './data.env' });

const db = mysql.createConnection({
    host: process.env.DATABASE_HOST,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE
});

// Middleware
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// Session middleware
app.use(
    session({
        secret: 'your_secret_key',
        resave: false,
        saveUninitialized: false,
    })
);

app.set('view engine', 'hbs');

// MySQL connection
db.connect((error) => {
    if (error) {
        console.log(error);
    } else {
        console.log('MYSQL Connected...');
    }
});

// Routes
app.use('/', require('./routes/pages')); // Home, Register, Login
app.use('/auth', require('./routes/auth')); // Auth routes (Register, Login, Dashboard)

app.listen(5000, () => {
    console.log('Server started on port 5000');
});
