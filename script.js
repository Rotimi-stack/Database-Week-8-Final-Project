
function getToken() {
    const token = localStorage.getItem('jwt');
    if (!token) {
        console.error('No token found in localStorage');
    }
    return token;
}

document.addEventListener("DOMContentLoaded", function () {
    // Populate Food Type options dynamically
    populateFoodTypeDropdown();

    //------------------------------------------------------Donate Button Logic--------------------------------

    // Define the Donate button
    const donateButton = document.querySelector('.donate-button');

    // Check if token exists and open modal function
    function checkTokenAndOpenModal() {
        const token = localStorage.getItem('jwt'); // Check for the stored token

        if (!token) {
            // If no token, redirect to login page
            window.location.href = '/login';
        } else {
            // If token exists, open the Become a Donor modal (modal 1)
            openModal('modal1');
        }
    }

    // Event listener for the Donate button
    donateButton.addEventListener('click', (event) => {
        event.preventDefault();
        checkTokenAndOpenModal(); // Call the function on click
    });

    // After login, check if user was redirected from Donate button
    if (window.location.search.includes('redirectedFromDonate=true')) {
        checkTokenAndOpenModal(); // Check token and open modal if login is successful
    }

    // Modal opening logic
    function openModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'block';
        }
    }











    //----------------------------------------------------------------CREATE DONOR---------------------------------------
    // Handle form submission
    const donorForm = document.querySelector("#modal1 .form-container form");
    donorForm.addEventListener("submit", function (event) {
        event.preventDefault();

        // Clear previous validation messages before re-validating
        clearValidationMessages();

        // Capture form data
        const donorData = {
            donor_name: document.querySelector("#name").value.trim(),
            phone_no: document.querySelector("#phone").value.trim(),
            gender: document.querySelector("#gender").value,
            email: document.querySelector("#email").value.trim(),
            address: document.querySelector("#address").value.trim(),
            food_type_donated: document.querySelector("#food").value,
            quantity: document.querySelector("#qty").value,
            donation_date: document.querySelector("#schedule-date").value
        };

        // Validate form data
        const validationErrors = validateDonorData(donorData);
        if (validationErrors.length > 0) {
            displayValidationMessages(validationErrors);
            return; // Stop the form submission if validation errors exist
        }

        // Send data to the server if validation is successful
        fetch("/food-donors", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(donorData)
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error("Error adding food donor");
                }
                return response.text();
            })
            .then(message => {
                console.log("Food donor created successfully:", donorData); // Log success and data
                alert(message); // Notify the user
                donorForm.reset(); // Reset the form
            })
            .catch(error => {
                console.error("Error:", error);
                alert("Failed to add food donor. Please try again.");
            });
    });

    //Check if token is available before opening modal

    const donorButton = document.querySelector('.food-hub');

    donorButton.addEventListener('click', (event) => {
        event.preventDefault(); // Prevents default link behavior

        // Use getToken function to retrieve the token
        const token = getToken();

        if (!token) {
            // Redirect to login if token is absent
            window.location.href = '/login'; // Adjust the login path as needed
        } else {
            // If token exists, proceed with modal display
            openModal('modal1');
        }
    });

    // Function to open modal
    function openModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'block';
        }
    }


    //----------------------------------------------------------------CREATE Volunteer---------------------------------------
    // Volunteer Form Submission
    const volunteerForm = document.querySelector("#modal2 .form-container form");
    volunteerForm.addEventListener("submit", function (event) {
        event.preventDefault();

        const volunteerData = {
            name: document.querySelector("#modal2 #name").value.trim(),
            email: document.querySelector("#modal2 #email").value.trim(),
            phone_no: document.querySelector("#modal2 #phone").value.trim(),
            gender: document.querySelector("#modal2 #gender").value,
            address: document.querySelector("#modal2 #address").value.trim(),
            role: document.querySelector("#modal2 #role").value.trim(),
            registration_date: document.querySelector("#modal2 #schedule-date").value
        };

        // Basic Validation
        const volunteerMissingFields = [];
        for (const key in volunteerData) {
            if (!volunteerData[key]) {
                volunteerMissingFields.push(key);
            }
        }

        if (volunteerMissingFields.length > 0) {
            alert(`Please fill in the following fields: ${volunteerMissingFields.join(", ")}`);
            return;
        }

        // Send Volunteer Data to the Server
        fetch("/add-volunteer", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(volunteerData)
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error("Error adding volunteer");
                }
                return response.text();
            })
            .then(message => {
                console.log("Volunteer added successfully:", volunteerData);
                alert(message);
                volunteerForm.reset();
            })
            .catch(error => {
                console.error("Error:", error);
                alert("Failed to add volunteer. Please try again.");
            });
    });

    //Check if token is available before opening modal

    const volunteerButton = document.querySelector('.food-hub1');

    volunteerButton.addEventListener('click', (event) => {
        event.preventDefault(); // Prevents default link behavior

        // Use getToken function to retrieve the token
        const token = getToken();

        if (!token) {
            // Redirect to login if token is absent
            window.location.href = '/login'; // Adjust the login path as needed
        } else {
            // If token exists, proceed with modal display
            openModal('modal2');
        }
    });

    // Function to open modal
    function openModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'block';
        }
    }


    //----------------------------------------------------------------CREATE Logistics---------------------------------------
    // Logistics Form Submission
    const logisticsForm = document.querySelector("#modal3 .form-container form");
    logisticsForm.addEventListener("submit", function (event) {
        event.preventDefault();

        const logisticsData = {
            name: document.querySelector("#modal3 #name").value.trim(),
            phone_no: document.querySelector("#modal3 #phone").value.trim(),
            gender: document.querySelector("#modal3 #gender").value,
            email: document.querySelector("#modal3 #email").value.trim(),
            address: document.querySelector("#modal3 #address").value.trim(),
            company: document.querySelector("#modal3 #company").value.trim(),
            registration_date: document.querySelector("#modal3 #schedule-date").value
        };

        const logisticsErrors = validateLogisticsData(logisticsData);
        if (logisticsErrors.length > 0) {
            alert(logisticsErrors.map(error => `${error.field}: ${error.message}`).join("\n"));
            return;
        }

        // Send Logistics Data to the Server
        fetch("/logistics-providers", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(logisticsData)
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error("Error adding logistics provider");
                }
                return response.text();
            })
            .then(message => {
                console.log("Logistics provider created successfully:", logisticsData);
                alert(message);
                logisticsForm.reset();
            })
            .catch(error => {
                console.error("Error:", error);
                alert("Failed to add logistics provider. Please try again.");
            });
    });

    //Check if token is available before opening modal

    const logisticsButton = document.querySelector('.food-hub2');

    logisticsButton.addEventListener('click', (event) => {
        event.preventDefault(); // Prevents default link behavior

        // Use getToken function to retrieve the token
        const token = getToken();

        if (!token) {
            // Redirect to login if token is absent
            window.location.href = '/login'; // Adjust the login path as needed
        } else {
            // If token exists, proceed with modal display
            openModal('modal3');
        }
    });

    // Function to open modal
    function openModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'block';
        }
    }



    //----------------------------------------------------------------CREATE Quality Assurance---------------------------------------
    // Get the form for Quality Assurance provider
    const qualityAssuranceForm = document.querySelector("#modal4 .form-container form");


    //Check if token is available before opening modal

    const assuranceButton = document.querySelector('.food-hub3');

    assuranceButton.addEventListener('click', (event) => {
        event.preventDefault(); // Prevents default link behavior

        // Use getToken function to retrieve the token
        const token = getToken();

        if (!token) {
            // Redirect to login if token is absent
            window.location.href = '/login'; // Adjust the login path as needed
        } else {
            // If token exists, proceed with modal display
            openModal('modal4');
        }
    });

    // Function to open modal
    function openModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'block';
        }
    }


    // Add event listener for form submission
    qualityAssuranceForm.addEventListener("submit", function (event) {
        event.preventDefault();

        // Collect the data from the form
        const qualityAssuranceData = {
            name: document.querySelector("#modal4 #name").value.trim(),
            email: document.querySelector("#modal4 #email").value.trim(),
            phone_no: document.querySelector("#modal4 #phone").value.trim(),
            gender: document.querySelector("#modal4 #gender").value,
            address: document.querySelector("#modal4 #address").value.trim(),
            company: document.querySelector("#modal4 #company").value.trim(),
            role: document.querySelector("#modal4 #role").value.trim(),
            registration_date: document.querySelector("#modal4 #schedule-date").value
        };

        // Validate the form data
        const qualityAssuranceErrors = validateQualityAssuranceData(qualityAssuranceData);
        if (qualityAssuranceErrors.length > 0) {
            alert(qualityAssuranceErrors.map(error => `${error.field}: ${error.message}`).join("\n"));
            return;
        }

        // Send the data to the server
        fetch("/quality-assurance", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(qualityAssuranceData)
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error("Error adding quality assurance provider");
                }
                return response.text();
            })
            .then(message => {
                console.log("Quality assurance provider added successfully:", qualityAssuranceData);
                alert(message);
                qualityAssuranceForm.reset();  // Reset the form
            })
            .catch(error => {
                console.error("Error:", error);
                alert("Failed to add quality assurance provider. Please try again.");
            });
    });


    //----------------------------------------------------------------CREATE Partner---------------------------------------
    const partnerForm = document.querySelector("#modal5 .form-container form");


    //Check if token is available before opening modal

    const partnerButton = document.querySelector('.food-hub4');

    partnerButton.addEventListener('click', (event) => {
        event.preventDefault(); // Prevents default link behavior

        // Use getToken function to retrieve the token
        const token = getToken();

        if (!token) {
            // Redirect to login if token is absent
            window.location.href = '/login'; // Adjust the login path as needed
        } else {
            // If token exists, proceed with modal display
            openModal('modal5');
        }
    });

    // Function to open modal
    function openModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'block';
        }
    }

    // Add event listener for form submission
    partnerForm.addEventListener("submit", function (event) {
        event.preventDefault();

        // Collect the data from the form
        const partnerData = {
            name: document.querySelector("#modal5 #name").value.trim(),
            email: document.querySelector("#modal5 #email").value.trim(),
            phone_no: document.querySelector("#modal5 #phone").value.trim(),
            gender: document.querySelector("#modal5 #gender").value,
            address: document.querySelector("#modal5 #address").value.trim(),
            company: document.querySelector("#modal5 #company").value.trim(),
            role: document.querySelector("#modal5 #role").value.trim(),
            registration_date: document.querySelector("#modal5 #schedule-date").value
        };

        // Validate the form data (similar to the quality assurance validation)
        const partnerErrors = validatePartnerData(partnerData);
        if (partnerErrors.length > 0) {
            alert(partnerErrors.map(error => `${error.field}: ${error.message}`).join("\n"));
            return;
        }

        // Send the data to the server
        fetch("/partners", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(partnerData)
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error("Error adding partner");
                }
                return response.text();
            })
            .then(message => {
                console.log("Partner added successfully:", partnerData);
                alert(message);
                partnerForm.reset();  // Reset the form
            })
            .catch(error => {
                console.error("Error:", error);
                alert("Failed to add partner. Please try again.");
            });
    });


});



// Function to populate Food Type dropdown
function populateFoodTypeDropdown() {
    fetch('/api/food-types')
        .then(response => {
            if (!response.ok) throw new Error('Network response was not ok');
            return response.json();
        })
        .then(data => {
            console.log('Data fetched:', data); // Log fetched data
            const foodTypeSelect = document.getElementById('food');
            if (!foodTypeSelect) {
                console.error("Food dropdown element not found");
                return;
            }

            foodTypeSelect.innerHTML = '<option value="">Select a Food Type</option>';
            data.forEach(foodType => {
                const option = document.createElement('option');
                option.value = foodType.food_type_id;
                option.textContent = foodType.food_name;
                foodTypeSelect.appendChild(option);
            });
        })
        .catch(error => {
            console.error('Error fetching food types:', error);
        });
}

// Validation function for donor data
function validateDonorData(donorData) {
    const errors = [];
    if (!donorData.donor_name) errors.push({ field: "name", message: "Name is required" });
    if (!donorData.phone_no) errors.push({ field: "phone", message: "Phone number is required" });
    if (!donorData.gender) errors.push({ field: "gender", message: "Gender is required" });
    if (!donorData.email) errors.push({ field: "email", message: "Email is required" });
    if (!donorData.address) errors.push({ field: "address", message: "Address is required" });
    if (!donorData.food_type_donated) errors.push({ field: "food", message: "Food type is required" });
    if (!donorData.quantity || isNaN(donorData.quantity) || donorData.quantity <= 0)
        errors.push({ field: "qty", message: "Quantity must be a positive number" });
    if (!donorData.donation_date) errors.push({ field: "schedule-date", message: "Donation date is required" });
    return errors;
}

// Validation function for volunteer data
function validateVolunteerData(volunteerData) {
    const errors = [];
    if (!volunteerData.name) errors.push({ field: "name", message: "Name is required" });
    if (!volunteerData.email) errors.push({ field: "email", message: "Email is required" });
    if (!volunteerData.phone) errors.push({ field: "phone", message: "Phone number is required" });
    if (!volunteerData.gender) errors.push({ field: "gender", message: "Gender is required" });
    if (!volunteerData.address) errors.push({ field: "address", message: "Address is required" });
    if (!volunteerData.role) errors.push({ field: "role", message: "Role is required" });
    if (!volunteerData.registration_date) errors.push({ field: "schedule-date", message: "Registration date is required" });
    return errors;
}

// Validation function for logistics provider data
function validateLogisticsData(logisticsData) {
    const errors = [];
    if (!logisticsData.name) errors.push({ field: "name", message: "Name is required" });
    if (!logisticsData.phone_no) errors.push({ field: "phone", message: "Phone number is required" });
    if (!logisticsData.gender) errors.push({ field: "gender", message: "Gender is required" });
    if (!logisticsData.email) errors.push({ field: "email", message: "Email is required" });
    if (!logisticsData.address) errors.push({ field: "address", message: "Address is required" });
    if (!logisticsData.company) errors.push({ field: "company", message: "Company name is required" });
    if (!logisticsData.registration_date) errors.push({ field: "schedule-date", message: "Date is required" });
    return errors;
}

// Function to validate the Quality Assurance form data
function validateQualityAssuranceData(data) {
    const errors = [];

    // Check for empty fields and add specific messages
    if (!data.name) errors.push({ field: "Name", message: "Name is required" });
    if (!data.email) errors.push({ field: "Email", message: "Email is required" });
    if (!data.phone_no) errors.push({ field: "Phone No", message: "Phone number is required" });
    if (!data.gender) errors.push({ field: "Gender", message: "Gender is required" });
    if (!data.address) errors.push({ field: "Address", message: "Address is required" });
    if (!data.company) errors.push({ field: "Company", message: "Company is required" });
    if (!data.role) errors.push({ field: "Role", message: "Role is required" });
    if (!data.registration_date) errors.push({ field: "Registration Date", message: "Registration date is required" });

    return errors;
}

// Validation function for partner data
function validatePartnerData(partnerData) {
    const errors = [];

    if (!partnerData.name) errors.push({ field: "name", message: "Name is required" });
    if (!partnerData.email) errors.push({ field: "email", message: "Email is required" });
    if (!partnerData.phone_no) errors.push({ field: "phone", message: "Phone number is required" });
    if (!partnerData.gender) errors.push({ field: "gender", message: "Gender is required" });
    if (!partnerData.address) errors.push({ field: "address", message: "Address is required" });
    if (!partnerData.company) errors.push({ field: "company", message: "Company name is required" });
    if (!partnerData.role) errors.push({ field: "role", message: "Role is required" });
    if (!partnerData.registration_date) errors.push({ field: "schedule-date", message: "Date is required" });

    return errors;
}



// Function to display validation messages on the form
function displayValidationMessages(errors) {
    errors.forEach(error => {
        const field = document.getElementById(error.field);
        if (field) {
            const errorElement = document.createElement("div");
            errorElement.className = "text-danger";
            errorElement.innerText = error.message;
            field.parentNode.appendChild(errorElement); // Display error below the field
        }
    });
}

// Function to clear previous validation messages
function clearValidationMessages() {
    const errorMessages = document.querySelectorAll(".text-danger");
    errorMessages.forEach(errorElement => errorElement.remove());
}
















// Get all the modals
var modals = document.querySelectorAll('.modal');

// Get all the buttons that open the modal
var buttons = document.querySelectorAll('.food-hub');

// Loop through the buttons and add click event listeners
buttons.forEach(function (button) {
    button.onclick = function (event) {
        event.preventDefault(); // Prevent the default anchor behavior
        var modalId = button.getAttribute('data-modal');
        document.getElementById(modalId).style.display = "block";
    };
});

// Get all the <span> elements that close the modal
var spans = document.querySelectorAll('.close');

// Loop through the spans and add click event listeners
spans.forEach(function (span) {
    span.onclick = function () {
        var modalId = span.getAttribute('data-modal');
        document.getElementById(modalId).style.display = "none";
    };
});

// Close the modal if the user clicks anywhere outside of the modal content
window.onclick = function (event) {
    modals.forEach(function (modal) {
        if (event.target == modal) {
            modal.style.display = "none";
        }
    });
};




//--------------------------------------------CHAT FEATURE------------------------------------------

// Event listener for the chat icon to toggle the chat container visibility
document.getElementById("chat-icon").addEventListener("click", function () {
    const chatContainer = document.getElementById("chat-container");

    // Toggle the chat container visibility
    if (chatContainer.style.display === "none" || chatContainer.style.display === "") {
        chatContainer.style.display = "block"; // Show the chat container
    } else {
        chatContainer.style.display = "none"; // Hide the chat container
    }
});

// Event listener for the close button in the chat header
document.getElementById("close-chat").addEventListener("click", function () {
    document.getElementById("chat-container").style.display = "none";
});

// Event listener for sending a message
document.getElementById("send-btn").addEventListener("click", function () {
    const chatInput = document.getElementById("chat-input");
    const chatBox = document.getElementById("chat-box");

    const userMessage = chatInput.value.trim(); // Get the message and trim whitespaces

    if (userMessage !== "") {

        const userMessageDiv = document.createElement("div");
        userMessageDiv.textContent = userMessage;
        userMessageDiv.className = "user";
        chatBox.appendChild(userMessageDiv);

        chatInput.value = ""; // Clear input field

        // Simulate a bot response after a short delay
        setTimeout(() => {
            const botMessageDiv = document.createElement("div");
            botMessageDiv.textContent = "Bot: " + userMessage; // Simulate a bot response
            botMessageDiv.className = "bot";
            chatBox.appendChild(botMessageDiv);

            // Scroll to the bottom of the chat box
            chatBox.scrollTop = chatBox.scrollHeight;
        }, 1000);
    }
});















