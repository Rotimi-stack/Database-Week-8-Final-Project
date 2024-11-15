// Import required packages
const express = require('express');
const db = require('./database'); // Import the database connection
const cors = require('cors');
const fs = require('fs'); // To handle file system operations
const path = require('path'); // Import path module
const session = require('express-session');//Session Management
const app = express();// Create an instance of the Express framework
const bcrypt = require('bcrypt');//For Hashing Password
const bodyParser = require('body-parser');


app.use(bodyParser.urlencoded({ extended: true }));// Body parser middleware to parse form data from POST requests
app.use(bodyParser.json());

app.use(cors());// Use CORS and JSON middleware
app.use(express.json());

app.use(express.static(path.join(__dirname)));// Serve static files from the project directory


// Set up session management
app.use(session({
    secret: 'victorHubFood07#', // Replace with a strong secret key
    resave: false,
    saveUninitialized: true,
    cookie: { secure: true } // Set to true if using HTTPS
}));

//#region JSON AUTHENTICATION
const jwt = require('jsonwebtoken');
const SECRET_KEY = 'victorhubapp07#'; // Replace with a strong secret key


//authentication middleare that performs validation of the token
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: 'Access token required' });
    }

    jwt.verify(token, SECRET_KEY, (err, decoded) => {
        if (err) {
            return res.status(403).json({ message: 'Invalid token' });
        }

        // Setting default role to 'user' for ordinary users without a role
        req.user = { id: decoded.id, role: decoded.role || 'user' };

        next();
    });
}
//#endregion

// Check user session
app.get('/check-session', (req, res) => {
    // Check if the user is logged in
    if (req.session.adminId) {
        return res.json({ role: 'super_admin' }); // User is an admin
    } else if (req.session.userId) {
        return res.json({ role: 'user' }); // User is a patient
    } else {
        return res.status(401).json({ message: 'Unauthorized' }); // User not logged in
    }
});







//#region REGISTRATION AND LOGIN
//-----------------------------------------------Serve registration.html page-------------------------------------
app.get('/registration', (req, res) => {
    const filePath = path.join(__dirname, 'registration.html');
    fs.readFile(filePath, (err, data) => {
        if (err) {
            res.status(500).send('Error loading registration.html');
        } else {
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(data); // Serve the registration page
        }
    });
});

// Handle registration form submission (POST request)
app.post('/register', (req, res) => {
    console.log(req.body);
    const { firstName, lastName, email, password, phone, address, dob, gender } = req.body;

    // Hash the password
    bcrypt.hash(password, 10, (err, hash) => {
        if (err) {
            return res.status(500).json({ success: false, message: 'Error hashing password' });
        }



        const sql = `INSERT INTO users (first_name, last_name, email, password_hash, phone,address, date_of_birth, gender) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
        db.query(sql, [firstName, lastName, email, password, phone, address, dob, gender,], (err) => {
            if (err) {
                console.log(err.stack)
                return res.status(500).send('Error during registration.');
            }
            res.redirect('/login.html'); // Redirect to login page after successful registration
        });
    });
});


//-----------------------------------------------------Serve login.html page------------------------------------
app.get('/login', (req, res) => {

    const filePath = path.join(__dirname, 'login.html');
    fs.readFile(filePath, (err, data) => {
        if (err) {
            res.status(500).send('Error loading login.html');
        } else {
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(data); // Serve the login page
        }
    });
});

app.post('/login', (req, res) => {
    console.log('Request Body:', req.body);
    const { loginemail, loginpassword } = req.body;

    // Define SQL queries for patients and admin
    const usersQuery = `SELECT id FROM users WHERE email = ?`;
    const adminQuery = `SELECT id, role FROM admin WHERE username = ?`;

    // Check if user exists in the patients table
    db.query(usersQuery, [loginemail], (err, usersRows) => {
        if (err) {
            console.error('Error querying users:', err);
            return res.status(500).json({ success: false, message: 'An error occurred. Please try again.' });
        }

        if (usersRows.length > 0) {
            // Patient found, create JWT token and redirect to index
            const user = usersRows[0];
            const token = jwt.sign({ id: user.id }, SECRET_KEY, { expiresIn: '1h' });
            console.log('JWT Token:', token);  // Log the token to the console
            req.session.userId = user.id;
            return res.json({ success: true, token, redirect: '/index' }); // Explicit redirect to /index
        }

        // If not found in users, check in the admin table
        db.query(adminQuery, [loginemail], (err, adminRows) => {
            if (err) {
                console.error('Error querying admin:', err);
                return res.status(500).json({ success: false, message: 'An error occurred. Please try again.' });
            }

            if (adminRows.length === 0) {
                // No user found in either table
                return res.status(401).json({ success: false, message: 'Invalid email or password' });
            }

            // User found in admin table, check role
            const admin = adminRows[0];
            const token = jwt.sign({ id: admin.id, role: admin.role }, SECRET_KEY, { expiresIn: '1h' });
            req.session.adminId = admin.id;
            req.session.role = admin.role;

            if (admin.role === 'super_admin' || admin.role === 'admin') {
                req.session.isAuthenticatedForDashboard = true; 
                // If the role is admin, create a token and redirect to dashboard
                return res.json({ success: true, token, redirect: '/dashboard.html' });
            } else {
                // Return a response for non-admin roles
                return res.status(403).json({ success: false, message: 'Access restricted to admins.' });
            }
        });
    });
});

//#endregion

//#region INDEX
// Serve the index.html page
app.get('/index', (req, res) => {
    const filePath = path.join(__dirname, 'index.html');
    fs.readFile(filePath, (err, data) => {
        if (err) {
            res.status(500).send('Error loading index.html');
        } else {
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(data); // Send index.html content
        }
    });
});
//#endregion

//#region DASHBOARD
// Route to access the dashboard securely




app.get('/admin', (req, res) => {
    // Serve the admin.html page
    const filePath = path.join(__dirname, 'admin.html');
    fs.readFile(filePath, (err, data) => {
        if (err) {
            res.status(500).send('Error loading admin.html');
        } else {
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(data); // Send admin.html content
        }
    });
});

// Middleware to mark dashboard access attempt
app.get('/dashboard', (req, res) => {
    // Set a session flag to indicate the user requested the dashboard page
    req.session.dashboardAccessRequested = true;
    // Redirect to login
    res.redirect('/login');
});

// Protect direct access to /dashboard.html
app.get('/dashboard.html', (req, res) => {
    // Check if the user accessed via a successful login
    if (!req.session.isAuthenticatedForDashboard || !req.session.role) {
      // Deny access if the flag or role is missing
      return res.redirect('/login');
    }
  
    // If authenticated, serve dashboard.html and clear the flag
    req.session.isAuthenticatedForDashboard = false; // Clear the flag after access
    const filePath = path.join(__dirname, 'dashboard.html');
    fs.readFile(filePath, (err, data) => {
      if (err) {
        res.status(500).send('Error loading dashboard.html');
      } else {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(data);
      }
    });
  });
  

//#endregion

//#region VOLUNTEERS
// -------------------------------------------Volunteers table Section-----------------------------------------------
app.get('/volunteer', (req, res) => {
    const filePath = path.join(__dirname, 'volunteers.html');
    fs.readFile(filePath, (err, data) => {
        if (err) {
            console.error('Error loading volunteer.html:', err);
            res.status(500).send('Error loading volunteer.html');
        } else {
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(data);
        }
    });
});

app.get('/create-volunteers-table', (req, res) => {
    const createVolunteersTableQuery = `
        CREATE TABLE IF NOT EXISTS Volunteers (
            volunteer_id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(100) NOT NULL,
            phone_no VARCHAR(15) NOT NULL,
            gender VARCHAR(15) NOT NULL,
            email VARCHAR(100) NOT NULL,
            address VARCHAR(200) NOT NULL,
            role VARCHAR(50) NOT NULL,
            registration_date DATETIME DEFAULT CURRENT_TIMESTAMP
        );
    `;

    db.query(createVolunteersTableQuery, (err, result) => {
        if (err) {
            console.error('Error creating Volunteers table:', err);
            res.status(500).send('Error creating Volunteers table');
        } else {
            console.log('Volunteers table created successfully');
            res.send('Volunteers table created successfully');
        }
    });
});

// Define the endpoint to insert data into the Volunteers table
app.post('/add-volunteer', (req, res) => {
    const { name, email, phone_no, gender, address, role, registration_date } = req.body;

    if (!name || !email || !address || !role) {
        return res.status(400).send('All fields are required');
    }

    const insertVolunteerQuery = `
        INSERT INTO Volunteers (name, email, phone_no, gender, address, role, registration_date)
        VALUES (?, ?, ?, ?, ?, ? ,?);
    `;

    db.query(insertVolunteerQuery, [name, email, phone_no, gender, address, role, registration_date], (err, result) => {
        if (err) {
            console.error('Error inserting data into Volunteers table:', err);
            return res.status(500).send('Error inserting data into Volunteers table');
        }
        res.send('Volunteer added successfully');
    });
});

// Define the endpoint to fetch data from the Volunteers table
app.get('/fetch-volunteers', (req, res) => {
    const fetchVolunteersQuery = `
        SELECT * FROM volunteers;
    `;

    db.query(fetchVolunteersQuery, (err, results) => {
        if (err) {
            console.error('Error fetching data from volunteers table:', err);
            return res.status(500).send('Error fetching data from volunteers table');
        }
        res.json(results);
    });
});

// Define the endpoint to fetch a volunteer by their volunteer_id
app.get('/volunteers/:id', (req, res) => {
    const volunteerId = req.params.id;
    const fetchVolunteerByIdQuery = `
        SELECT * FROM Volunteers WHERE volunteer_id = ?;
    `;

    db.query(fetchVolunteerByIdQuery, [volunteerId], (err, results) => {
        if (err) {
            console.error('Error fetching data from Volunteers table:', err);
            return res.status(500).send('Error fetching data from Volunteers table');
        }

        if (results.length === 0) {
            return res.status(404).send('Volunteer not found');
        }

        res.json(results[0]);
    });
});

// Endpoint to update an existing volunteer
app.put('/update-volunteers/:id', (req, res) => {
    const volunteerId = req.params.id;
    const { name, phone_no, gender, email, address, role, registration_date } = req.body;

    const updateVolunteerQuery = `
        UPDATE Volunteers
        SET name = ?, phone_no = ?, gender = ?, email = ?, address = ?, role = ?, registration_date = ?
        WHERE volunteer_id = ?;
    `;

    db.query(updateVolunteerQuery, [name, phone_no, gender, email, address, role, registration_date, volunteerId], (err, result) => {
        if (err) {
            console.error('Error updating volunteer:', err);
            return res.status(500).json({ success: false, message: 'Error updating volunteer' });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Volunteer not found' });
        }

        res.status(200).json({ success: true, message: 'Volunteer updated successfully' });
    });
});

//#endregion

//#region LOGISTICS
//----------------------------------------------------- LogisticsProviders Section-----------------------------------------------
app.get('/logistics', (req, res) => {
    const filePath = path.join(__dirname, 'logistics.html');
    fs.readFile(filePath, (err, data) => {
        if (err) {
            console.error('Error loading volunteer.html:', err);
            res.status(500).send('Error loading volunteer.html');
        } else {
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(data);
        }
    });
});

app.get('/create-logistics-providers-table', (req, res) => {
    const createLogisticsProvidersTableQuery = `
        CREATE TABLE IF NOT EXISTS LogisticsProviders (
            provider_id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(100) NOT NULL,
            email VARCHAR(100) NOT NULL,
            phone_no VARCHAR(15) NOT NULL,
            gender VARCHAR(15) NOT NULL,
            address VARCHAR(200) NOT NULL,
            status VARCHAR(50) DEFAULT 'in-active',
            company VARCHAR(100) NOT NULL,
            registration_date DATETIME DEFAULT CURRENT_TIMESTAMP
        );
    `;

    db.query(createLogisticsProvidersTableQuery, (err, result) => {
        if (err) {
            console.error('Error creating LogisticsProviders table:', err);
            res.status(500).send('Error creating LogisticsProviders table');
        } else {
            console.log('LogisticsProviders table created successfully');
            res.send('LogisticsProviders table created successfully');
        }
    });
});

// Endpoint to fetch all logistics providers
app.get('/logistics-providers', (req, res) => {
    const fetchLogisticsProvidersQuery = `
        SELECT * FROM LogisticsProviders;
    `;

    db.query(fetchLogisticsProvidersQuery, (err, results) => {
        if (err) {
            console.error('Error fetching data from LogisticsProviders table:', err);
            return res.status(500).send('Error fetching data from LogisticsProviders table');
        }
        res.json(results);
    });
});

// Endpoint to fetch a logistics provider by provider_id
app.get('/logistics-providers/:id', (req, res) => {
    const providerId = req.params.id;
    const fetchLogisticsProviderByIdQuery = `
        SELECT * FROM LogisticsProviders WHERE provider_id = ?;
    `;

    db.query(fetchLogisticsProviderByIdQuery, [providerId], (err, results) => {
        if (err) {
            console.error('Error fetching data from LogisticsProviders table:', err);
            return res.status(500).send('Error fetching data from LogisticsProviders table');
        }

        if (results.length === 0) {
            return res.status(404).send('Logistics provider not found');
        }

        res.json(results[0]);
    });
});

// Endpoint to add a new logistics provider
app.post('/logistics-providers', (req, res) => {
    const { name, phone_no, gender, email, address, company, registration_date } = req.body;

    const addLogisticsProviderQuery = `
        INSERT INTO LogisticsProviders (name,phone_no,gender, email, address, company,registration_date)
        VALUES (?, ?, ?, ?, ?,?,?);
    `;

    db.query(addLogisticsProviderQuery, [name, phone_no, gender, email, address, company, registration_date], (err, result) => {
        if (err) {
            console.error('Error adding logistics provider:', err);
            return res.status(500).send('Error adding logistics provider');
        }
        res.status(201).send('Logistics provider added successfully');
    });
});

// Endpoint to update an existing logistics provider
app.put('/update-logistics/:id', (req, res) => {
    const logisticsId = req.params.id;
    const { name, email, phone_no, gender, address, status, company, registration_date } = req.body;

    const updateLogisticsProviderQuery = `
        UPDATE LogisticsProviders
        SET name = ?, email = ?, phone_no = ?, gender = ?, address = ?, status = ?, company = ?, registration_date = ?
        WHERE provider_id = ?;
    `;

    db.query(updateLogisticsProviderQuery, [name, email, phone_no, gender, address, status, company, registration_date, logisticsId], (err, result) => {
        if (err) {
            console.error('Error updating logistics provider:', err);
            return res.status(500).send('Error updating Logistics provider');
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Logistics not found' });
        }

        res.status(200).json({ success: true, message: 'Logistics updated successfully' });
    });
});

//#endregion

//#region QUALITY ASSURANCE
//------------------------------Define the endpoint to create the Quality Assurance table-------------------------------

app.get('/quality-assurance', (req, res) => {
    const filePath = path.join(__dirname, 'quality-assurance.html');
    fs.readFile(filePath, (err, data) => {
        if (err) {
            console.error('Error loading quality-assurance.html:', err);
            res.status(500).send('Error loading quality-assurance.html');
        } else {
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(data);
        }
    });
});

app.get('/create-quality-assurance-table', (req, res) => {
    const createQualityProvidersTableQuery = `
        CREATE TABLE IF NOT EXISTS QualityAssurance (
            provider_id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(100) NOT NULL,
            email VARCHAR(100) NOT NULL,
            phone_no VARCHAR(15),
            gender VARCHAR(15) NOT NULL,
            role VARCHAR(50) NOT NULL,
            status VARCHAR(50) DEFAULT 'in-active',
            address VARCHAR(200),
            company VARCHAR(100),
            registration_date DATETIME DEFAULT CURRENT_TIMESTAMP
           
        );
    `;

    db.query(createQualityProvidersTableQuery, (err, result) => {
        if (err) {
            console.error('Error creating QualityProviders table:', err);
            res.status(500).send('Error creating QualityProviders table');
        } else {
            console.log('QualityProviders table created successfully');
            res.send('QualityProviders table created successfully');
        }
    });
});

// Endpoint to fetch all quality providers
app.get('/api/quality-assurance', (req, res) => {
    const fetchQualityProvidersQuery = `
        SELECT * FROM QualityAssurance;
    `;

    db.query(fetchQualityProvidersQuery, (err, results) => {
        if (err) {
            console.error('Error fetching data from QualityAssurance table:', err);
            return res.status(500).send('Error fetching data from QualityAssurance table');
        }
        res.json(results);
    });
});

// Endpoint to fetch a quality provider by provider_id
app.get('/quality-assurance/:id', (req, res) => {
    const providerId = req.params.id;
    const fetchQualityProviderByIdQuery = `
        SELECT * FROM QualityProviders WHERE provider_id = ?;
    `;

    db.query(fetchQualityProviderByIdQuery, [providerId], (err, results) => {
        if (err) {
            console.error('Error fetching data from QualityProviders table:', err);
            return res.status(500).send('Error fetching data from QualityProviders table');
        }

        if (results.length === 0) {
            return res.status(404).send('Quality provider not found');
        }

        res.json(results[0]);
    });
});

// Endpoint to update an existing quality assurance provider
app.put('/update-quality/:id', (req, res) => {
    const providerId = req.params.id;
    const { name, email, phone_no, gender, role, status, address, company, registration_date } = req.body;

    const updateQualityAssuranceProviderQuery = `
        UPDATE QualityAssurance
        SET name = ?, email = ?, phone_no = ?, gender = ?, role = ?, status = ?, address = ?, company = ?, registration_date = ?
        WHERE provider_id = ?;
    `;

    db.query(updateQualityAssuranceProviderQuery, [name, email, phone_no, gender, role, status, address, company, registration_date, providerId], (err, result) => {
        if (err) {
            console.error('Error updating quality assurance provider:', err);
            return res.status(500).json({ success: false, message: 'Error updating quality assurance provider' }); // Send JSON response
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Quality assurance provider not found' }); // Send JSON response
        }

        res.json({ success: true, message: 'Quality assurance provider updated successfully' }); // Send JSON response
    });
});

// Endpoint to add a new quality assurance provider
app.post('/quality-assurance', (req, res) => {
    const { name, email, phone_no, gender, address, company, registration_date, role } = req.body;

    const addQualityAssuranceProviderQuery = `
        INSERT INTO QualityAssurance (name, email, phone_no, gender, address, company, registration_date, role)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?);
    `;

    db.query(addQualityAssuranceProviderQuery, [name, email, phone_no, gender, address, company, registration_date, role], (err, result) => {
        if (err) {
            console.error('Error adding quality assurance provider:', err);
            return res.status(500).send('Error adding quality assurance provider');
        }
        res.status(201).send('Quality assurance provider added successfully');
    });
});

//#endregion

//#region PARTNERS
//---------------------------------------Define the endpoint to create the Partners table---------------------------------
app.get('/partners', (req, res) => {
    const filePath = path.join(__dirname, 'partners.html');
    fs.readFile(filePath, (err, data) => {
        if (err) {
            console.error('Error loading partners.html:', err);
            res.status(500).send('Error loading partners.html');
        } else {
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(data);
        }
    });
});

//Fetch All Partners
app.get('/api/partners', (req, res) => {
    console.log('API partners endpoint hit'); // Log when the endpoint is accessed
    const fetchMediaPartnersQuery = `
        SELECT * FROM Partners;
    `;

    db.query(fetchMediaPartnersQuery, (err, results) => {
        if (err) {
            console.error('Error fetching data from Partners table:', err);
            return res.status(500).send('Error fetching data from Partners table');
        }
        console.log('Fetched partners:', results); // Log the fetched data
        res.json(results);
    });
});

app.get('/create-partners-table', (req, res) => {
    const createPartnersTableQuery = `
        CREATE TABLE IF NOT EXISTS Partners (
            partner_id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(100) NOT NULL,
            email VARCHAR(100) NOT NULL,
            phone_no VARCHAR(15),
            gender VARCHAR(10),
            address VARCHAR(200),
            company VARCHAR(100),
            registration_date DATETIME DEFAULT CURRENT_TIMESTAMP,
            role VARCHAR(50)
        );
    `;

    db.query(createPartnersTableQuery, (err, result) => {
        if (err) {
            console.error('Error creating Partners table:', err);
            res.status(500).send('Error creating Partners table');
        } else {
            console.log('Partners table created successfully');
            res.send('Partners table created successfully');
        }
    });
});

// Endpoint to add a new  partner
app.post('/partners', (req, res) => {
    const { name, email, phone_no, gender, address, company, role, registration_date } = req.body;

    const addMediaPartnerQuery = `
        INSERT INTO Partners (name, email, phone_no, gender, address, company, role,registration_date)
        VALUES (?, ?, ?, ?, ?, ?,?,?);
    `;

    db.query(addMediaPartnerQuery, [name, email, phone_no, gender, address, company, role, registration_date], (err, result) => {
        if (err) {
            console.error('Error adding media partner:', err);
            return res.status(500).send('Error adding media partner');
        }
        res.status(201).send('Media partner added successfully');
    });
});

// Endpoint to fetch a  partner by partner_id
app.get('/partners/:id', (req, res) => {
    const partnerId = req.params.id;
    const fetchMediaPartnerByIdQuery = `
        SELECT * FROM MediaPartners WHERE partner_id = ?;
    `;

    db.query(fetchMediaPartnerByIdQuery, [partnerId], (err, results) => {
        if (err) {
            console.error('Error fetching data from MediaPartners table:', err);
            return res.status(500).send('Error fetching data from MediaPartners table');
        }

        if (results.length === 0) {
            return res.status(404).send('Media partner not found');
        }

        res.json(results[0]);
    });
});

// Endpoint to update an existing media partner
app.put('/update-partners/:id', (req, res) => {
    const partnerId = req.params.id;
    const { name, email, gender, phone_no, address, company, registration_date, role } = req.body;

    const updateMediaPartnerQuery = `
        UPDATE Partners
        SET name = ?, email = ?, gender = ?, phone_no = ?, address = ?, company = ?, registration_date = ?, role = ?
        WHERE partner_id = ?;
    `;

    db.query(updateMediaPartnerQuery, [name, email, gender, phone_no, address, company, registration_date, role, partnerId], (err, result) => {
        if (err) {
            console.error('Error updating media partner:', err.sqlMessage || err);
            return res.status(500).json({ success: false, message: 'Error updating  partner' });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: ' partner not found' });
        }

        res.json({ success: true, message: 'Media partner updated successfully' });
    });
});

//#endregion

//#region FOOD DONORS
//---------------------------------------------------------Route to create the FoodDonors table------------------------------------
app.get('/donors', (req, res) => {
    const filePath = path.join(__dirname, 'donors.html');
    fs.readFile(filePath, (err, data) => {
        if (err) {
            console.error('Error loading donors.html:', err);
            res.status(500).send('Error loading donors.html');
        } else {
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(data);
        }
    });
});
app.get('/create-food-donors-table', (req, res) => {
    const createFoodDonorsTableQuery = `
        CREATE TABLE IF NOT EXISTS FoodDonors (
            donor_id INT AUTO_INCREMENT PRIMARY KEY,
            donor_name VARCHAR(100) NOT NULL,
            phone_no VARCHAR(15),
            email VARCHAR(100),
            gender VARCHAR(10),
            address VARCHAR(200),
            food_type_donated INT,
            donation_date DATE,
            quantity DECIMAL(10, 2),
            status VARCHAR(20) DEFAULT 'active',
            registration_date DATETIME DEFAULT CURRENT_TIMESTAMP,
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

// Endpoint to fetch all food donors with food_name instead of food_type_donated ID
app.get('/api/donors', (req, res) => {
    const fetchAllFoodDonorsQuery = `
        SELECT d.donor_id, d.donor_name, d.phone_no, d.email, d.gender, d.address, 
               f.food_name AS food_type_donated, d.donation_date, d.quantity, d.status, d.donation_date
        FROM FoodDonors d
        JOIN FoodType f ON d.food_type_donated = f.food_type_id;
    `;

    db.query(fetchAllFoodDonorsQuery, (err, results) => {
        if (err) {
            console.error('Error fetching data from FoodDonors table:', err);
            return res.status(500).send('Error fetching data from FoodDonors table');
        }

        res.json(results);
    });
});


/// Endpoint to fetch a food donor by donor_id, showing food_name instead of food_type_donated ID
app.get('/food-donors/:id', (req, res) => {
    const donorId = req.params.id;
    const fetchFoodDonorByIdQuery = `
       SELECT d.donor_id, d.donor_name, d.phone_no, d.email, d.gender, d.address, 
               f.food_name AS food_type_donated, d.donation_date, d.quantity, d.status, d.donation_date
        FROM FoodDonors d
        JOIN FoodType f ON d.food_type_donated = f.food_type_id;
        WHERE d.donor_id = ?;
    `;

    db.query(fetchFoodDonorByIdQuery, [donorId], (err, results) => {
        if (err) {
            console.error('Error fetching data from FoodDonors table:', err);
            return res.status(500).send('Error fetching data from FoodDonors table');
        }

        if (results.length === 0) {
            return res.status(404).send('Food donor not found');
        }

        res.json(results[0]);
    });
});

// Endpoint to add a new food donor
app.post('/food-donors', (req, res) => {
    const { donor_name, phone_no, gender, email, address, food_type_donated, donation_date, quantity } = req.body;

    const addFoodDonorQuery = `
        INSERT INTO FoodDonors (donor_name, phone_no, gender, email, address, food_type_donated, donation_date, quantity)
        VALUES (?, ?, ?, ?, ?, ?, ?,?);
    `;

    db.query(addFoodDonorQuery, [donor_name, phone_no, gender, email, address, food_type_donated, donation_date, quantity], (err, result) => {
        if (err) {
            console.error('Error adding food donor:', err);
            return res.status(500).send('Error adding food donor');
        }
        res.status(201).send('Food donor added successfully');
    });
});

// Endpoint to update an existing food donor
app.put('/update-donors/:id', (req, res) => {
    const donorId = req.params.id;
    const { donor_name, phone_no, email, address, food_type_donated, donation_date, quantity, status } = req.body;

    const updateFoodDonorQuery = `
        UPDATE FoodDonors
        SET donor_name = ?, phone_no = ?, email = ?, address = ?, food_type_donated = ?, donation_date = ?, quantity = ?, status = ?
        WHERE donor_id = ?;
    `;

    db.query(updateFoodDonorQuery, [donor_name, phone_no, email, address, food_type_donated, donation_date, quantity, status, donorId], (err, result) => {
        if (err) {
            console.error('Error updating food donor:', err);
            return res.status(500).send('Error updating food donor');
        }

        if (result.affectedRows === 0) {
            return res.status(404).send('Food donor not found');
        }

        res.send('Food donor updated successfully');
    });
});

//#endregion

//#region FOOD TYPE
//---------------------------------------------------Route to create the FoodType table------------------------------------
app.get('/create-foodtype-table', (req, res) => {
    const createFoodTypeTableQuery = `
        CREATE TABLE IF NOT EXISTS FoodType (
            food_type_id INT AUTO_INCREMENT PRIMARY KEY,
            food_name VARCHAR(100) NOT NULL,
            description VARCHAR(200),
            category VARCHAR(100),
            expire_date DATETIME DEFAULT CURRENT_TIMESTAMP
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

//fetch food type id's and names
app.get('/api/food-types', (req, res) => {
    const sql = 'SELECT food_type_id, food_name FROM FoodType';
    db.query(sql, (err, results) => {
        if (err) {
            console.error('Error fetching food types:', err);
            return res.status(500).json({ message: 'Error fetching food types.' });
        }
        res.json(results); // Send the food types as JSON
    });
});

// Endpoint to fetch all food types
app.get('/food-types', (req, res) => {
    const fetchFoodTypesQuery = `
        SELECT * FROM FoodType;
    `;

    db.query(fetchFoodTypesQuery, (err, results) => {
        if (err) {
            console.error('Error fetching data from FoodType table:', err);
            return res.status(500).send('Error fetching data from FoodType table');
        }
        res.json(results);
    });
});

// Endpoint to fetch a food type by food_type_id
app.get('/food-types/:id', (req, res) => {
    const foodTypeId = req.params.id;
    const fetchFoodTypeByIdQuery = `
        SELECT * FROM FoodType WHERE food_type_id = ?;
    `;

    db.query(fetchFoodTypeByIdQuery, [foodTypeId], (err, results) => {
        if (err) {
            console.error('Error fetching data from FoodType table:', err);
            return res.status(500).send('Error fetching data from FoodType table');
        }

        if (results.length === 0) {
            return res.status(404).send('Food type not found');
        }

        res.json(results[0]);
    });
});

// Endpoint to add a new food type
app.post('/food-types', (req, res) => {
    const { food_name, description, category, expire_date } = req.body;

    const addFoodTypeQuery = `
        INSERT INTO FoodType (food_name, description, category, expire_date)
        VALUES (?, ?, ?, ?);
    `;

    db.query(addFoodTypeQuery, [food_name, description, category, expire_date], (err, result) => {
        if (err) {
            console.error('Error adding food type:', err);
            return res.status(500).send('Error adding food type');
        }
        res.status(201).send('Food type added successfully');
    });
});

// Endpoint to update an existing food type
app.put('/foodtypes/:id', (req, res) => {
    const foodTypeId = req.params.id;
    const { food_name, description, category, expire_date } = req.body;

    const updateFoodTypeQuery = `
        UPDATE FoodType
        SET food_name = ?, description = ?, category = ?, expire_date = ?
        WHERE food_type_id = ?;
    `;

    db.query(updateFoodTypeQuery, [food_name, description, category, expire_date, foodTypeId], (err, result) => {
        if (err) {
            console.error('Error updating food type:', err);
            return res.status(500).send('Error updating food type');
        }

        if (result.affectedRows === 0) {
            return res.status(404).send('Food type not found');
        }

        res.send('Food type updated successfully');
    });
});

//#endregion

//#region BENEFICIARIES
//----------------------------------------Route to create the Beneficiaries table------------------------------------
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

// Endpoint to fetch all beneficiaries
app.get('/beneficiaries', (req, res) => {
    const fetchBeneficiariesQuery = `
        SELECT * FROM Beneficiaries;
    `;

    db.query(fetchBeneficiariesQuery, (err, results) => {
        if (err) {
            console.error('Error fetching data from Beneficiaries table:', err);
            return res.status(500).send('Error fetching data from Beneficiaries table');
        }
        res.json(results);
    });
});

// Endpoint to fetch a beneficiary by beneficiary_id
app.get('/beneficiaries/:id', (req, res) => {
    const beneficiaryId = req.params.id;
    const fetchBeneficiaryByIdQuery = `
        SELECT * FROM Beneficiaries WHERE beneficiary_id = ?;
    `;

    db.query(fetchBeneficiaryByIdQuery, [beneficiaryId], (err, results) => {
        if (err) {
            console.error('Error fetching data from Beneficiaries table:', err);
            return res.status(500).send('Error fetching data from Beneficiaries table');
        }

        if (results.length === 0) {
            return res.status(404).send('Beneficiary not found');
        }

        res.json(results[0]);
    });
});

// Endpoint to add a new beneficiary
app.post('/beneficiaries', (req, res) => {
    const { beneficiary_name, phone_no, email, address, delivery_preference, food_type_id, registration_date } = req.body;

    const addBeneficiaryQuery = `
        INSERT INTO Beneficiaries (beneficiary_name, phone_no, email, address, delivery_preference, food_type_id, registration_date)
        VALUES (?, ?, ?, ?, ?, ?, ?);
    `;

    db.query(addBeneficiaryQuery, [beneficiary_name, phone_no, email, address, delivery_preference, food_type_id, registration_date], (err, result) => {
        if (err) {
            console.error('Error adding beneficiary:', err);
            return res.status(500).send('Error adding beneficiary');
        }
        res.status(201).send('Beneficiary added successfully');
    });
});

// Endpoint to update an existing beneficiary
app.put('/beneficiaries/:id', (req, res) => {
    const beneficiaryId = req.params.id;
    const { beneficiary_name, phone_no, email, address, delivery_preference, food_type_id, registration_date, status } = req.body;

    const updateBeneficiaryQuery = `
        UPDATE Beneficiaries
        SET beneficiary_name = ?, phone_no = ?, email = ?, address = ?, delivery_preference = ?, food_type_id = ?, registration_date = ?, status = ?
        WHERE beneficiary_id = ?;
    `;

    db.query(updateBeneficiaryQuery, [beneficiary_name, phone_no, email, address, delivery_preference, food_type_id, registration_date, status, beneficiaryId], (err, result) => {
        if (err) {
            console.error('Error updating beneficiary:', err);
            return res.status(500).send('Error updating beneficiary');
        }

        if (result.affectedRows === 0) {
            return res.status(404).send('Beneficiary not found');
        }

        res.send('Beneficiary updated successfully');
    });
});

//#endregion

//#region DISTRIBUTION CENTRES
//--------------------------------------------------Route to create the DistributionCenters table--------------------------------------------
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

// Endpoint to fetch all distribution centers
app.get('/distribution-centers', (req, res) => {
    const fetchDistributionCentersQuery = `
        SELECT * FROM DistributionCenters;
    `;

    db.query(fetchDistributionCentersQuery, (err, results) => {
        if (err) {
            console.error('Error fetching data from DistributionCenters table:', err);
            return res.status(500).send('Error fetching data from DistributionCenters table');
        }
        res.json(results);
    });
});

// Endpoint to fetch a distribution center by center_id
app.get('/distribution-centers/:id', (req, res) => {
    const centerId = req.params.id;
    const fetchDistributionCenterByIdQuery = `
        SELECT * FROM DistributionCenters WHERE center_id = ?;
    `;

    db.query(fetchDistributionCenterByIdQuery, [centerId], (err, results) => {
        if (err) {
            console.error('Error fetching data from DistributionCenters table:', err);
            return res.status(500).send('Error fetching data from DistributionCenters table');
        }

        if (results.length === 0) {
            return res.status(404).send('Distribution center not found');
        }

        res.json(results[0]);
    });
});

// Endpoint to add a new distribution center
app.post('/distribution-centers', (req, res) => {
    const { center_name, location, contact_number, capacity, operating_hours, manager_name } = req.body;

    const addDistributionCenterQuery = `
        INSERT INTO DistributionCenters (center_name, location, contact_number, capacity, operating_hours, manager_name)
        VALUES (?, ?, ?, ?, ?, ?);
    `;

    db.query(addDistributionCenterQuery, [center_name, location, contact_number, capacity, operating_hours, manager_name], (err, result) => {
        if (err) {
            console.error('Error adding distribution center:', err);
            return res.status(500).send('Error adding distribution center');
        }
        res.status(201).send('Distribution center added successfully');
    });
});

// Endpoint to update an existing distribution center
app.put('/distribution-centers/:id', (req, res) => {
    const centerId = req.params.id;
    const { center_name, location, contact_number, capacity, operating_hours, manager_name } = req.body;

    const updateDistributionCenterQuery = `
        UPDATE DistributionCenters
        SET center_name = ?, location = ?, contact_number = ?, capacity = ?, operating_hours = ?, manager_name = ?
        WHERE center_id = ?;
    `;

    db.query(updateDistributionCenterQuery, [center_name, location, contact_number, capacity, operating_hours, manager_name, centerId], (err, result) => {
        if (err) {
            console.error('Error updating distribution center:', err);
            return res.status(500).send('Error updating distribution center');
        }

        if (result.affectedRows === 0) {
            return res.status(404).send('Distribution center not found');
        }

        res.send('Distribution center updated successfully');
    });
});

//#endregion

//#region DISTRIBUTION RECORDS
//-------------------------------------------------------Route to create the DistributionRecords table-----------------------------
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

// Endpoint to fetch all distribution records
app.get('/distribution-records', (req, res) => {
    const fetchDistributionRecordsQuery = `
        SELECT * FROM DistributionRecords;
    `;

    db.query(fetchDistributionRecordsQuery, (err, results) => {
        if (err) {
            console.error('Error fetching data from DistributionRecords table:', err);
            return res.status(500).send('Error fetching data from DistributionRecords table');
        }
        res.json(results);
    });
});

// Endpoint to fetch a distribution record by distribution_id
app.get('/distribution-records/:id', (req, res) => {
    const distributionId = req.params.id;
    const fetchDistributionRecordByIdQuery = `
        SELECT * FROM DistributionRecords WHERE distribution_id = ?;
    `;

    db.query(fetchDistributionRecordByIdQuery, [distributionId], (err, results) => {
        if (err) {
            console.error('Error fetching data from DistributionRecords table:', err);
            return res.status(500).send('Error fetching data from DistributionRecords table');
        }

        if (results.length === 0) {
            return res.status(404).send('Distribution record not found');
        }

        res.json(results[0]);
    });
});

// Endpoint to add a new distribution record
app.post('/distribution-records', (req, res) => {
    const { beneficiary_id, food_type_id, quantity, receiving_date, notes } = req.body;

    const addDistributionRecordQuery = `
        INSERT INTO DistributionRecords (beneficiary_id, food_type_id, quantity, receiving_date, notes)
        VALUES (?, ?, ?, ?, ?);
    `;

    db.query(addDistributionRecordQuery, [beneficiary_id, food_type_id, quantity, receiving_date, notes], (err, result) => {
        if (err) {
            console.error('Error adding distribution record:', err);
            return res.status(500).send('Error adding distribution record');
        }
        res.status(201).send('Distribution record added successfully');
    });
});

// Endpoint to update an existing distribution record
app.put('/distribution-records/:id', (req, res) => {
    const distributionId = req.params.id;
    const { beneficiary_id, food_type_id, quantity, receiving_date, notes } = req.body;

    const updateDistributionRecordQuery = `
        UPDATE DistributionRecords
        SET beneficiary_id = ?, food_type_id = ?, quantity = ?, receiving_date = ?, notes = ?
        WHERE distribution_id = ?;
    `;

    db.query(updateDistributionRecordQuery, [beneficiary_id, food_type_id, quantity, receiving_date, notes, distributionId], (err, result) => {
        if (err) {
            console.error('Error updating distribution record:', err);
            return res.status(500).send('Error updating distribution record');
        }

        if (result.affectedRows === 0) {
            return res.status(404).send('Distribution record not found');
        }

        res.send('Distribution record updated successfully');
    });
});

//#endregion

//#region DELIVERY RECORDS
//-----------------------------Route to create the DeliveryRecords table------------------------------------
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

// Endpoint to fetch all delivery records
app.get('/delivery-records', (req, res) => {
    const fetchDeliveryRecordsQuery = `
        SELECT * FROM DeliveryRecords;
    `;

    db.query(fetchDeliveryRecordsQuery, (err, results) => {
        if (err) {
            console.error('Error fetching data from DeliveryRecords table:', err);
            return res.status(500).send('Error fetching data from DeliveryRecords table');
        }
        res.json(results);
    });
});

// Endpoint to fetch a delivery record by delivery_id
app.get('/delivery-records/:id', (req, res) => {
    const deliveryId = req.params.id;
    const fetchDeliveryRecordByIdQuery = `
        SELECT * FROM DeliveryRecords WHERE delivery_id = ?;
    `;

    db.query(fetchDeliveryRecordByIdQuery, [deliveryId], (err, results) => {
        if (err) {
            console.error('Error fetching data from DeliveryRecords table:', err);
            return res.status(500).send('Error fetching data from DeliveryRecords table');
        }

        if (results.length === 0) {
            return res.status(404).send('Delivery record not found');
        }

        res.json(results[0]);
    });
});

// Endpoint to add a new delivery record
app.post('/delivery-records', (req, res) => {
    const { center_id, food_type_id, receiving_personnel, delivery_date, delivery_status, notes } = req.body;

    const addDeliveryRecordQuery = `
        INSERT INTO DeliveryRecords (center_id, food_type_id, receiving_personnel, delivery_date, delivery_status, notes)
        VALUES (?, ?, ?, ?, ?, ?);
    `;

    db.query(addDeliveryRecordQuery, [center_id, food_type_id, receiving_personnel, delivery_date, delivery_status, notes], (err, result) => {
        if (err) {
            console.error('Error adding delivery record:', err);
            return res.status(500).send('Error adding delivery record');
        }
        res.status(201).send('Delivery record added successfully');
    });
});

// Endpoint to update an existing delivery record
app.put('/delivery-records/:id', (req, res) => {
    const deliveryId = req.params.id;
    const { center_id, food_type_id, receiving_personnel, delivery_date, delivery_status, notes } = req.body;

    const updateDeliveryRecordQuery = `
        UPDATE DeliveryRecords
        SET center_id = ?, food_type_id = ?, receiving_personnel = ?, delivery_date = ?, delivery_status = ?, notes = ?
        WHERE delivery_id = ?;
    `;

    db.query(updateDeliveryRecordQuery, [center_id, food_type_id, receiving_personnel, delivery_date, delivery_status, notes, deliveryId], (err, result) => {
        if (err) {
            console.error('Error updating delivery record:', err);
            return res.status(500).send('Error updating delivery record');
        }

        if (result.affectedRows === 0) {
            return res.status(404).send('Delivery record not found');
        }

        res.send('Delivery record updated successfully');
    });
});
//#endregion




//#region LOGOUT
// Handle logout
app.get('/logout', (req, res) => {
    req.session.destroy(() => {
        res.clearCookie('sessionId'); // Clear any session cookies
        res.redirect('/login'); // Redirect to login page after logout
    });
});
//#endregion






// Listen on port 3000
app.listen(3000, () => {
    console.log('Server running on port 3000');
});
