# The Food Distribution Management System

## Overview
The FoodHub is a Food Distribution Management System designed to ensure that food reaches those in need within the community. This system keeps track of food donors, beneficiaries, distribution centers, food types, and delivery records.

## Features
- **Food Donors:** Track individuals or organizations sharing food.
- **Beneficiaries:** Manage individuals receiving food assistance.
- **Distribution Centers:** Keep records of where food is gathered and distributed.
- **Food Types:** Categorize different food items available for distribution.
- **Delivery Records:** Document when food is delivered and to whom.

## Database Structure
The database includes the following tables:
- **FoodDonors**
- **Beneficiaries**
- **DistributionCenters**
- **FoodType**
- **DeliveryRecords**
- **DistributionRecords**
- **CenterDeliveries**

## Getting Started
1. Clone the repository:
   ```bash
   git clone <repository-url>

2. Create A database food_hub
CREATE DATABASE food_hub;

3. create new user priviledges you can use the below credentials or create a new one.
NB-You can use your default mysql credentials or create new user for the food_hub Database
mysql -u root -p -e "CREATE USER 'fooduser'@'localhost' IDENTIFIED BY 'foodhub';"

4.)Grant User Privileges
mysql -u root -p -e "GRANT ALL PRIVILEGES ON food_hub.* TO 'fooduser'@'localhost';"  

5.) Set the new user credentials in the database.js and make sure you successfully connect to the database

6) Create a database.js file like the sample below
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

7) Create a .env file to hold your new user name and password like the sample below
DB_HOST=localhost
DB_PORT=3306
DB_USER= Your new username
DB_PASSWORD=Your new password
DB_DATABASE= food_hub


6.) Voila!!! Your backend is all set up

6). Good Job! now you can add an HTML file and test the endpoints

