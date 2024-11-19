//Import
const mysql = require('mysql2');

require('dotenv').config(); // Load environment variables

// Create connection
const db = mysql.createConnection({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE
});


//connect to database
db.connect( (error) => {
    if(error){
        console.log('An Error Occured:', error.stack)
        return;
    }
    console.log('DB Connected!')
});

//export connection
module.exports= db;