const mysql = require("mysql");
const dotenv = require("dotenv");

// Load environment variables
dotenv.config({ path: './data.env' });

// Create the MySQL database connection
const db = mysql.createConnection({
  host: process.env.DATABASE_HOST,
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE,
});

// Connect to the database
db.connect((error) => {
  if (error) {
    console.log(error);
  } else {
    console.log("MySQL Connected...");
  }
});

// Export the connection to use in other files
module.exports = db;
