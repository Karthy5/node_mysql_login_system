const express = require('express');  
const mysql = require('mysql');
const path = require('path');
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const ipBanMiddleware = require('./middleware/ipBan'); // Import the middleware
const app = express();

dotenv.config({ path: './.env' });

const db = mysql.createConnection({
    host: process.env.DATABASE_HOST,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE
});

app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: "Too many requests from this IP, please try again after 15 minutes"
});

app.use(limiter);

app.set('view engine', 'hbs');

// Debugging the database connection
console.log("Attempting to connect to MySQL...");
db.connect((error) => {
    if (error) {
        console.error("Database connection error:", error);
    } else {
        console.log("MYSQL Connected...");
    }
});

// Make the db accessible to middleware
app.locals.db = db;

// Debug before applying middleware
console.log("Applying IP Ban Middleware...");
app.use(ipBanMiddleware);

app.use('/', require('./routes/pages'));
app.use('/auth', require('./routes/auth'));

app.listen(5000, () => {
    console.log('Server started on port 5000');
});
