// Import required packages
const http = require('http');
const db = require('./database'); // Import the database connection


//Express Framework used for handling Http Request
const express = require('express');

//Create an instance of the farmework
const app = express();

//DBMS Mysql
const mysql = require('mysql2');


//Cross origin resource sharing
const cors = require('cors');


app.use(cors());
app.use(express.json());



// Route to create the FoodDonors table
app.get('/create-food-donors-table', (req, res) => {
    const createFoodDonorsTableQuery = `
        CREATE TABLE IF NOT EXISTS FoodDonors (
            donor_id INT AUTO_INCREMENT PRIMARY KEY,
            donor_name VARCHAR(100) NOT NULL,
            phone_no VARCHAR(15),
            email VARCHAR(100),
            address VARCHAR(200),
            food_type_donated INT,
            donation_date DATE,
            quantity DECIMAL(10, 2),
            status VARCHAR(20) DEFAULT 'active',
            FOREIGN KEY (food_type_donated) REFERENCES FoodType(food_type_id)  -- Foreign key constraint
            
        );
    `;

    db.query(createFoodDonorsTableQuery, (err, result) => {
        if (err) {
            console.error('Error creating FoodDonors table:', err);
            res.status(500).send('Error creating FoodDonors table');
        } else {
            console.log('FoodDonors table created successfully');
            res.send('FoodDonors table created successfully');
        }
    });
});

// Route to create the FoodType table
app.get('/create-foodtype-table', (req, res) => {
    const createFoodTypeTableQuery = `
        CREATE TABLE IF NOT EXISTS FoodType (
            food_type_id INT AUTO_INCREMENT PRIMARY KEY,
            food_name VARCHAR(100) NOT NULL,
            description VARCHAR(200),
            category VARCHAR(100),
            expire_date datetime
        );
    `;

    db.query(createFoodTypeTableQuery, (err, result) => {
        if (err) {
            console.error('Error creating FoodType table:', err);
            res.status(500).send('Error creating FoodType table');
        } else {
            console.log('FoodType table created successfully');
            res.send('FoodType table created successfully');
        }
    });
});

// Route to create the Beneficiaries table
app.get('/create-beneficiaries-table', (req, res) => {
    const createBeneficiariesTableQuery = `
        CREATE TABLE IF NOT EXISTS Beneficiaries (
            beneficiary_id INT AUTO_INCREMENT PRIMARY KEY,
            beneficiary_name VARCHAR(100) NOT NULL,
            phone_no VARCHAR(15),
            email VARCHAR(100),
            address VARCHAR(200),
            delivery_preference VARCHAR(50),
            food_type_id INT,
            registration_date DATE,
            status VARCHAR(20) DEFAULT 'active'
        );
    `;

    db.query(createBeneficiariesTableQuery, (err, result) => {
        if (err) {
            console.error('Error creating Beneficiaries table:', err);
            res.status(500).send('Error creating Beneficiaries table');
        } else {
            console.log('Beneficiaries table created successfully');
            res.send('Beneficiaries table created successfully');
        }
    });
});

// Route to create the DistributionCenters table
app.get('/create-distributioncenters-table', (req, res) => {
    const createDistributionCentersTableQuery = `
        CREATE TABLE IF NOT EXISTS DistributionCenters (
            center_id INT AUTO_INCREMENT PRIMARY KEY,
            center_name VARCHAR(100) NOT NULL,
            location VARCHAR(200) NOT NULL,
            contact_number VARCHAR(15),
            capacity INT,
            operating_hours VARCHAR(100),
            manager_name VARCHAR(100)
            date_created datetime
        );
    `;

    db.query(createDistributionCentersTableQuery, (err, result) => {
        if (err) {
            console.error('Error creating DistributionCenters table:', err);
            res.status(500).send('Error creating DistributionCenters table');
        } else {
            console.log('DistributionCenters table created successfully');
            res.send('DistributionCenters table created successfully');
        }
    });
});

// Route to create the DeliveryRecords table
app.get('/create-deliveryrecords-table', (req, res) => {
    const createDeliveryRecordsTableQuery = `
        CREATE TABLE IF NOT EXISTS DeliveryRecords (
            delivery_id INT AUTO_INCREMENT PRIMARY KEY,
            center_id INT,
            food_type_id INT,
            receiving_personnel VARCHAR(100) NOT NULL,
            delivery_date DATE NOT NULL,
            delivery_status VARCHAR(50) DEFAULT 'pending',
            notes VARCHAR(500),
            CONSTRAINT fk_center FOREIGN KEY (center_id) REFERENCES DistributionCenters(center_id),
            CONSTRAINT fk_food_type FOREIGN KEY (food_type_id) REFERENCES FoodType(food_type_id)
        );
    `;

    db.query(createDeliveryRecordsTableQuery, (err, result) => {
        if (err) {
            console.error('Error creating DeliveryRecords table:', err);
            res.status(500).send('Error creating DeliveryRecords table');
        } else {
            console.log('DeliveryRecords table created successfully');
            res.send('DeliveryRecords table created successfully');
        }
    });
});

// Route to create the DistributionRecords table
app.get('/create-distributionrecords-table', (req, res) => {
    const createDistributionRecordsTableQuery = `
        CREATE TABLE IF NOT EXISTS DistributionRecords (
            distribution_id INT AUTO_INCREMENT PRIMARY KEY,
            beneficiary_id INT,
            food_type_id INT,
            quantity INT NOT NULL,
            receiving_date DATE NOT NULL,
            notes VARCHAR(500)
            CONSTRAINT fk_beneficiary FOREIGN KEY (beneficiary_id) REFERENCES Beneficiaries(beneficiary_id),
            CONSTRAINT fk_food_type FOREIGN KEY (food_type_id) REFERENCES FoodType(food_type_id)
        );
    `;

    db.query(createDistributionRecordsTableQuery, (err, result) => {
        if (err) {
            console.error('Error creating DistributionRecords table:', err);
            res.status(500).send('Error creating DistributionRecords table');
        } else {
            console.log('DistributionRecords table created successfully');
            res.send('DistributionRecords table created successfully');
        }
    });
});

