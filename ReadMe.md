# 🍽️ The Food Distribution Management System: FoodHub

## 🌟 Overview  
FoodHub is a transformative **Food Distribution Management System** crafted to bridge the gap between surplus and scarcity, ensuring food reaches those in need within the community. 🍲✨  
This system meticulously tracks food donors, beneficiaries, distribution centers, food types, and delivery records, making the process efficient and transparent. 🌍🤝  

---

## 🚀 Features  
- 🏷️ **Food Donors**: Manage individuals and organizations generously sharing food.  
- 🏠 **Beneficiaries**: Keep track of those receiving food assistance.  
- 🏢 **Distribution Centers**: Monitor locations where food is stored and distributed.  
- 🍞 **Food Types**: Categorize and organize available food items.  
- 📦 **Delivery Records**: Log when and to whom food is delivered.  

---

## 🗂️ Database Structure  
FoodHub employs a robust database with the following tables:  

- **FoodDonors** 🍴  
- **Beneficiaries** 🤝  
- **DistributionCenters** 🏤  
- **FoodType** 🥗  
- **DeliveryRecords** 🚚  
- **DistributionRecords** 📑  
- **CenterDeliveries** 🗃️  

---

## 🔧 Getting Started  
Follow these steps to set up the FoodHub on your local machine:  

1. **Clone the Repository** 🖥️  
   ```bash
   git clone <repository-url>


2. Create A database food_hub
CREATE DATABASE food_hub;

---

3. Set Up User Privileges 👤
Use the credentials below or create your own:

---

mysql -u root -p -e "CREATE USER 'fooduser'@'localhost' IDENTIFIED BY 'foodhub';"
mysql -u root -p -e "GRANT ALL PRIVILEGES ON food_hub.* TO 'fooduser'@'localhost';"

4. Configure the Database Connection ⚙️
Update your database.js file with your MySQL credentials:

---

const mysql = require('mysql2');
require('dotenv').config(); // Load environment variables

const db = mysql.createConnection({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE
});

db.connect((error) => {
    if (error) {
        console.log('An Error Occurred:', error.stack);
        return;
    }
    console.log('DB Connected!');
});

---

5. Verify Database Connection 🔌
Test the connection to ensure your setup is correct.

---

❤️ Join the Mission
Together, we can combat hunger and waste by leveraging the power of technology. Let’s build a better tomorrow, one meal at a time. 🌟🍛

