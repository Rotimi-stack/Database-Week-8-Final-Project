//#region TIMEOUT MANAGEMENT
let inactivityTimeout;
const INACTIVITY_LIMIT = 5 * 60 * 1000; // 5 minutes of inactivity
const REFRESH_THRESHOLD = 50 * 60 * 1000; // Refresh the token 10 minutes before it expires
let tokenExpirationTime = Date.now() + 60 * 60 * 1000; // Initial expiration time (1 hour)


// Function to check token expiration and refresh it if necessary
function checkAndRefreshToken() {
    const currentTime = Date.now();
    if (currentTime >= tokenExpirationTime - REFRESH_THRESHOLD) {
        refreshToken();
    }
}

// Function to refresh the JWT token
function refreshToken() {
    const token = localStorage.getItem('jwt'); // Get the current token
    if (!token) return; // If no token is found, don't refresh

    fetch('/refresh-token', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}` // Send the current token to refresh it
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // Update expiration time and token in localStorage
            tokenExpirationTime = Date.now() + 60 * 60 * 1000; // Reset expiration to 1 hour from now
            localStorage.setItem('jwt', data.token); // Store the new token
            console.log('Token refreshed successfully');
        } else {
            console.error('Failed to refresh token');
        }
    })
    .catch(error => console.error('Error refreshing token:', error));
}

// Function to reset inactivity timer
function resetInactivityTimer() {
    clearTimeout(inactivityTimeout);
    inactivityTimeout = setTimeout(logout, INACTIVITY_LIMIT); // Log out after inactivity period

    // Refresh token whenever there's user activity
    checkAndRefreshToken();
}

// Function to log out the user
function logout() {
    localStorage.removeItem('jwt');  // Remove the token from localStorage
    window.location.href = '/login'; // Redirect to login page
}

// Event listeners to track user activity
window.onload = () => {
    // Reset inactivity timer on mousemove, keypress, scroll, etc.
    document.body.addEventListener('mousemove', resetInactivityTimer);
    document.body.addEventListener('keypress', resetInactivityTimer);
    document.body.addEventListener('scroll', resetInactivityTimer);
    
    // Initial call to set up inactivity timer
    resetInactivityTimer();
};

//#endregion

//#region SEARCH FUNCTION

// Generic search initialization function based on the content type
function initializeSearch(contentType) {
    const searchInput = document.getElementById('searchInput');

    if (searchInput) {
        searchInput.addEventListener('input', () => {
            if (contentType === 'partners') {
                filterTable();
            }
            // ...
        });

        // Add event listener for gender filter
        const genderFilter = document.getElementById('genderFilter');
        genderFilter.addEventListener('change', filterTable);
    } else {
        console.error('Search input not found!');
    }
}

//#endregion

//#region GENERIC TOKEN FUNCTION
function getToken() {
    const token = localStorage.getItem('jwt');
    if (!token) {
        console.error('No token found in localStorage');
        window.location.href = '/login'; // Redirect to login if no token
    }
    return token;
}


//#region PARTNERS
//---------------------------------------------------------------------------Partners--------------------

// Function to filter the partners table based on search input and gender filter
function filterTable() {
    // Ensure the table exists
    const table = document.getElementById('mediaTable');
    if (!table) {
        console.error('Table not found! Ensure it is loaded in the DOM.');
        return;
    }

    const searchInput = document.getElementById('searchInput');
    const genderFilter = document.getElementById('genderFilter');

    // Ensure all required elements are present before proceeding
    if (!searchInput || !genderFilter) {
        console.error('One or more filter elements not found!');
        return;
    }

    const searchValue = searchInput.value.toLowerCase();
    const genderValue = genderFilter.value;
    const rows = table.getElementsByTagName('tr');

    // Loop through table rows (excluding header row) to filter based on input
    for (let i = 1; i < rows.length; i++) { // Start at 1 to skip header row
        const row = rows[i];
        const name = row.cells[0].textContent.trim().toLowerCase();
        const gender = row.cells[2].textContent;

        const matchesSearch = name.includes(searchValue);
        const matchesGender = genderValue === '' || gender === genderValue;

        row.style.display = matchesSearch && matchesGender ? '' : 'none';
    }
}

// Function to load Partners Content
function loadPartnersContent() {
    console.log("Fetching media partners content...");

    // Load and apply the CSS for partners
    fetch('partners.css')
        .then(response => response.text())
        .then(css => {
            const style = document.createElement('style');
            style.innerHTML = css;
            document.head.appendChild(style);
        })
        .then(() => {
            // Fetch and load the HTML content for partners
            return fetch('/partners'); // Return the fetch promise
        })
        .then(response => {
            console.log("Response received:", response);
            if (!response.ok) throw new Error('Network response was not ok');
            return response.text();
        })
        .then(data => {
            const mainContent = document.querySelector('main');

            if (!mainContent) {
                console.error("Error: Element <main> not found in the DOM.");
                return; // Exit if the main element is missing
            }

            // Inject the fetched HTML into the main element
            mainContent.innerHTML = data;


            if (searchInput && genderFilter) {
                // Add event listeners here
                searchInput.addEventListener('input', filterTable);
                genderFilter.addEventListener('change', filterTable);
            } else {
                console.error('Search input or gender filter not found after loading content.');
            }

            initializePartnersEvents(); // Initialize modal and events
            fetchPartners(); // Fetch partner data for the table

        })
        .catch(error => console.error('Error loading partners content:', error));
}

// Function to fetch and display partners data
function fetchPartners() {


    fetch('/api/partners',{
        method: 'GET',
        headers: {
          
            'Content-Type': 'application/json'
        }

    }) // Ensure this matches the endpoint
        .then(response => {
            console.log('Response status:', response.status); // Log the response status
            return response.json(); // Directly parse the JSON response
        })
        .then(data => {
            console.log('Parsed JSON data:', data); // Log the parsed data

            const tableBody = document.querySelector('#mediaTable tbody');
            if (!tableBody) {
                console.error('Table body not found! Ensure mediaTable has a tbody.');
                return; // Exit if the table body is not found
            }
            tableBody.innerHTML = ''; // Clear any existing rows

            // Loop through the data and create table rows
            data.forEach(partner => {
                const row = document.createElement('tr'); // Create a new row
                row.innerHTML = `
                    <td>${partner.name}</td>
                    <td>${partner.phone_no}</td>
                    <td>${partner.gender}</td>
                    <td>${partner.email}</td>
                    <td>${partner.address}</td>
                    <td>${partner.company}</td>
                    <td>${partner.role}</td>
                    <td>${new Date(partner.registration_date).toLocaleDateString()}</td>
                    <td>
                      <button class="edit-button" onclick='openEditPartnerModal(${JSON.stringify(partner)})'>Edit</button>
                    </td>
                `;
                tableBody.appendChild(row); // Append the new row to the table body
            });
            // Call filterTable after inserting table rows
            setTimeout(filterTable, 100); // Add a small delay
        })
        .catch(error => {
            console.error('Error fetching partners:', error);
        });
}

// Initialize event listeners after loading partners content
function initializePartnersEvents() {
    const closeBtn = document.getElementById('closePartnerModal');
    const editPartnerModal = document.getElementById('editPartnerModal');
    const editPartnerForm = document.getElementById('editPartnerForm');

    // Close button functionality
    if (closeBtn && editPartnerModal) {
        closeBtn.onclick = () => { editPartnerModal.style.display = 'none'; };
    } else {
        console.error("Modal or close button not found! Verify your element IDs.");
    }

    // Edit Partner form submission
    if (editPartnerForm) {

        editPartnerForm.onsubmit = (event) => {
            event.preventDefault();

            const partnerData = {
                partnerId: document.getElementById('partnerId')?.value || '', // Safely handle potential null values
                name: document.getElementById('editName')?.value || '',
                phone_no: document.getElementById('editPhone')?.value || '',
                gender: document.getElementById('editGender')?.value || '',
                email: document.getElementById('editEmail')?.value || '',
                address: document.getElementById('editAddress')?.value || '',
                company: document.getElementById('editCompany')?.value || '',
                role: document.getElementById('editRole')?.value || '',
                registration_date: document.getElementById('editDate')?.value || '',
            };

            // PUT request to update partner
            fetch(`/update-partners/${partnerData.partnerId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                   
                },
                body: JSON.stringify(partnerData),
            })
                .then(response => {
                    // Check for successful response (status 200)
                    if (!response.ok) {
                        throw new Error(`Server responded with status ${response.status}`);
                    }
                    return response.json();  // Attempt to parse JSON
                })
                .then(data => {
                    // Handle server's JSON response
                    if (data.success) {
                        alert('Partner updated successfully!');
                        editPartnerModal.style.display = 'none';
                        fetchPartners();
                    } else {
                        alert('Error updating partner: ' + data.message);
                    }
                })
                .catch(error => {
                    // Detailed error logging for easier troubleshooting
                    console.error('Error updating partner:', error);
                    alert(`Failed to update partner: ${error.message}`);
                });
        };
    } else {
        console.error("Form element with ID 'editPartnerForm' not found.");
    }
}

// Open modal and fill the form with partner data
function openEditPartnerModal(partner) {
    document.getElementById('partnerId').value = partner.partner_id;
    document.getElementById('editName').value = partner.name;
    document.getElementById('editPhone').value = partner.phone_no;
    document.getElementById('editGender').value = partner.gender;
    document.getElementById('editEmail').value = partner.email;
    document.getElementById('editAddress').value = partner.address;
    document.getElementById('editCompany').value = partner.company;
    document.getElementById('editRole').value = partner.role;

    // Format the date to YYYY-MM-DD format for the date input
    const date = new Date(partner.registration_date);
    const formattedDate = date.toISOString().split('T')[0];
    document.getElementById('editDate').value = formattedDate;

    // Display the modal
    document.getElementById('editPartnerModal').style.display = 'block';
}

// Call loadPartnersContent on page load
document.addEventListener('DOMContentLoaded', loadPartnersContent);

//#endregion

//#region DONORS
//-----------------------------------------------------------------------DONORS------------------------------------
function loadDonorsContent() {
    console.log("Fetching donors content...");

    fetch('donors.css')
        .then(response => response.text())
        .then(css => {
            const style = document.createElement('style');
            style.innerHTML = css;
            document.head.appendChild(style);
        })
        .then(() => {
            return fetch('/donors'); // Fetch the donors.html content
        })
        .then(response => {
            console.log("Response received:", response);
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.text();
        })
        .then(data => {
            console.log("Data received:", data);
            const mainContainer = document.querySelector('main');
            mainContainer.innerHTML = data; // Insert the donors.html content

            // Call fetchDonors only after the content is inserted
            fetchDonors();
            initializeDonorEvents(); // do this so that the close button will work
        })
        .catch(error => {
            console.error('There has been a problem with your fetch operation:', error);
        });
}

// Initialize event listeners after loading donors content
function initializeDonorEvents() {
    const closeBtn = document.getElementById('closeDonorModal'); // Button to close the modal
    const editDonorModal = document.getElementById('editDonorModal'); // The modal for editing donor
    const editDonorForm = document.getElementById('editDonorForm'); // The form inside the modal

    // Close button functionality
    if (closeBtn && editDonorModal) {
        closeBtn.onclick = () => { editDonorModal.style.display = 'none'; }; // Hide the modal on close
    } else {
        console.error("Modal or close button not found! Verify your element IDs.");
    }

    // Edit Donor form submission
    if (editDonorForm) {
        editDonorForm.onsubmit = (event) => {
            event.preventDefault(); // Prevent default form submission behavior

            const donorData = {
                donorId: document.getElementById('donorId')?.value || '', // Safely handle potential null values
                donor_name: document.getElementById('editName')?.value || '', // Donor's name
                phone_no: document.getElementById('editPhone')?.value || '', // Donor's phone number
                gender: document.getElementById('editGender')?.value || '', // Donor's gender
                email: document.getElementById('editEmail')?.value || '', // Donor's email
                address: document.getElementById('editAddress')?.value || '', // Donor's address
                status: document.getElementById('editStatus')?.value || '', // Donor's status
                quantity: document.getElementById('editQuantity')?.value || '', // Quantity donated
                food_type_donated: document.getElementById('editFoodType')?.value || '', // Type of food donated
                donation_date: document.getElementById('editDate')?.value || '', // Donation date
            };

            // PUT request to update donor
            fetch(`/update-donors/${donorData.donorId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(donorData),
            })
                .then(response => {
                    // Check for successful response (status 200)
                    if (!response.ok) {
                        throw new Error(`Server responded with status ${response.status}`);
                    }
                    return response.json(); // Attempt to parse JSON
                })
                .then(data => {
                    // Handle server's JSON response
                    if (data.success) {
                        alert('Donor updated successfully!'); // Success message
                        editDonorModal.style.display = 'none'; // Hide the modal
                        fetchDonors(); // Refresh the donors list
                    } else {
                        alert('Error updating donor: ' + data.message); // Show error message
                    }
                })
                .catch(error => {
                    // Detailed error logging for easier troubleshooting
                    console.error('Error updating donor:', error);
                    alert(`Failed to update donor: ${error.message}`); // Alert for failed updates
                });
        };
    } else {
        console.error("Form element with ID 'editDonorForm' not found."); // Log error if form not found
    }
}


// Function to fetch and display Donors data
function fetchDonors() {

    fetch('/api/donors',{
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        },
    }) // Make sure this matches the endpoint
        .then(response => {
            console.log('Response status:', response.status); // Log the response status
            return response.json(); // Directly parse the JSON response
        })
        .then(data => {
            console.log('Parsed JSON data:', data); // Log the parsed data

            const tableBody = document.querySelector('#donorTable tbody');
            if (!tableBody) {
                console.error('Table body not found!');
                return; // Exit if the table body is not found
            }
            tableBody.innerHTML = ''; // Clear any existing rows

            // Loop through the data and create table rows
            data.forEach(donor => {
                const row = document.createElement('tr'); // Create a new row
                row.innerHTML = `
                    <td>${donor.donor_name}</td>
                    <td>${donor.phone_no}</td>
                    <td>${donor.gender}</td>
                    <td>${donor.email}</td>
                    <td>${donor.address}</td>
                    <td>${donor.food_type_donated}</td>
                    <td>${new Date(donor.donation_date).toLocaleDateString()}</td>
                    <td>${donor.quantity}</td>
                    <td>${donor.status}</td>

                    <td>
                      <button class="edit-button" onclick='openEditDonorModal(${JSON.stringify(donor)})'>Edit</button>
                    </td>
                `;
                tableBody.appendChild(row); // Append the new row to the table body
            });
        })
        .catch(error => {
            console.error('Error fetching donors:', error);
        });
}


// Open modal and fill the form with donor data
function openEditDonorModal(donor) {
    // Fill the form fields with donor data
    document.getElementById('donorId').value = donor.donor_id; // Unique ID for the donor
    document.getElementById('editName').value = donor.donor_name; // Name of the donor
    document.getElementById('editPhone').value = donor.phone_no; // Phone number
    document.getElementById('editGender').value = donor.gender; // Gender
    document.getElementById('editEmail').value = donor.email; // Email address
    document.getElementById('editAddress').value = donor.address; // Address
    document.getElementById('editStatus').value = donor.status; // Status of the donor
    document.getElementById('editQuantity').value = donor.quantity; // Quantity donated
    document.getElementById('editFoodType').value = donor.food_type_donated; // Quantity donated

    // Format the donation date to YYYY-MM-DD for the date input
    const donationDate = new Date(donor.donation_date);
    const formattedDate = donationDate.toISOString().split('T')[0];
    document.getElementById('editDate').value = formattedDate; // Date of donation

    // Display the modal
    document.getElementById('editDonorModal').style.display = 'block'; // Show the modal
}


// Function to filter the partners table based on search input and gender filter
function filterTable() {
    const searchInput = document.getElementById('searchInput').value.toLowerCase();
    const genderFilter = document.getElementById('genderFilter').value;

    const table = document.getElementById('donorTable');
    const rows = table.getElementsByTagName('tr');

    // Loop through table rows (excluding header row) to filter based on input
    for (let i = 1; i < rows.length; i++) { // Start at 1 to skip header row
        const row = rows[i];
        const donor_name = row.cells[0].textContent.toLowerCase();
        const gender = row.cells[2].textContent;

        // Check if the row matches the search and gender filter criteria
        const matchesSearch = donor_name.includes(searchInput);
        const matchesGender = genderFilter === '' || gender === genderFilter;

        // Show or hide the row based on filters
        if (matchesSearch && matchesGender) {
            row.style.display = ''; // Show row
        } else {
            row.style.display = 'none'; // Hide row
        }
    }
}


document.addEventListener('DOMContentLoaded', fetchDonors);

//#endregion

//#region QUALITY ASSURANCE
//------------------------------------------------------------------Quality Assurance--------------------------------

function loadQualityAssuranceContent() {
    console.log("Fetching quality assurance content...");
    fetch('quality-assurance.css')
        .then(response => response.text())
        .then(css => {
            const style = document.createElement('style');
            style.innerHTML = css;
            document.head.appendChild(style);
        })
        .then(() => {
            fetch('/quality-assurance')
                .then(response => {
                    console.log("Response received:", response);
                    if (!response.ok) {
                        throw new Error('Network response was not ok');
                    }
                    return response.text();
                })
                .then(data => {
                    console.log("Data received:", data);
                    const mainContainer = document.querySelector('main');
                    mainContainer.innerHTML = data;

                    fetchQualityAssurance();
                    initializeQualityEvents()
                })
                .catch(error => {
                    console.error('There has been a problem with your fetch operation:', error);
                });
        });
}

// Function to fetch and display Quality Assurance data
function fetchQualityAssurance() {

   
    fetch('/api/quality-assurance',{
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
            
        },
    }) // Make sure this matches the quality assurance endpoint
        .then(response => {
            console.log('Response status:', response.status); // Log the response status
            return response.json(); // Directly parse the JSON response
        })
        .then(data => {
            console.log('Parsed JSON data:', data); // Log the parsed data

            const tableBody = document.querySelector('#qualityTable tbody');
            if (!tableBody) {
                console.error('Table body not found!');
                return; // Exit if the table body is not found
            }
            tableBody.innerHTML = ''; // Clear any existing rows

            // Loop through the data and create table rows
            data.forEach(qualityAssurance => {
                const row = document.createElement('tr'); // Create a new row
                row.innerHTML = `
                    <td>${qualityAssurance.name}</td>
                    <td>${qualityAssurance.phone_no}</td>
                    <td>${qualityAssurance.gender}</td>
                    <td>${qualityAssurance.email}</td>
                    <td>${qualityAssurance.address}</td>
                    <td>${qualityAssurance.company}</td>
                    <td>${qualityAssurance.role}</td>
                    <td>${qualityAssurance.status}</td>
                    <td>${new Date(qualityAssurance.registration_date).toLocaleDateString()}</td>

                    <td>
                      <button class="edit-button" onclick='openEditQualityModal(${JSON.stringify(qualityAssurance)})'>Edit</button>
                    </td>
                `;
                tableBody.appendChild(row); // Append the new row to the table body
            });
        })
        .catch(error => {
            console.error('Error fetching quality assurance data:', error);
        });
}

// Open modal and fill the form with quality assurance data
function openEditQualityModal(qualityAssurance) {
    // Fill the form fields with quality assurance data
    document.getElementById('provider_id').value = qualityAssurance.provider_id; // Unique ID for the quality assurance entry
    document.getElementById('editName').value = qualityAssurance.name; // Name of the quality assurance personnel
    document.getElementById('editPhone').value = qualityAssurance.phone_no; // Phone number
    document.getElementById('editGender').value = qualityAssurance.gender; // Gender
    document.getElementById('editEmail').value = qualityAssurance.email; // Email address
    document.getElementById('editAddress').value = qualityAssurance.address; // Address
    document.getElementById('editCompany').value = qualityAssurance.company; // Company name
    document.getElementById('editRole').value = qualityAssurance.role; // Role in the company
    document.getElementById('editStatus').value = qualityAssurance.status; // Status of the quality assurance entry

    // Format the date to YYYY-MM-DD for the date input
    const date = new Date(qualityAssurance.registration_date);
    const formattedDate = date.toISOString().split('T')[0];
    document.getElementById('editDate').value = formattedDate; // Date of entry

    // Display the modal
    document.getElementById('editQualityModal').style.display = 'block'; // Show the modal
}

// Function to filter the quality assurance table based on search input and gender filter
function filterTable() {
    const searchInput = document.getElementById('searchInput').value.toLowerCase();
    const genderFilter = document.getElementById('genderFilter').value;

    const table = document.getElementById('qualityTable');
    const rows = table.getElementsByTagName('tr');

    // Loop through table rows (excluding header row) to filter based on input
    for (let i = 1; i < rows.length; i++) { // Start at 1 to skip header row
        const row = rows[i];
        const name = row.cells[0].textContent.toLowerCase();
        const gender = row.cells[3].textContent;

        // Check if the row matches the search and gender filter criteria
        const matchesSearch = name.includes(searchInput);
        const matchesGender = genderFilter === '' || gender === genderFilter;

        // Show or hide the row based on filters
        if (matchesSearch && matchesGender) {
            row.style.display = ''; // Show row
        } else {
            row.style.display = 'none'; // Hide row
        }
    }
}

// Initialize event listeners after loading quality assurance content
function initializeQualityEvents() {
    const closeBtn = document.getElementById('closeQualityModal');
    const editQualityModal = document.getElementById('editQualityModal'); 
    const editQualityForm = document.getElementById('editQualityForm'); 

    // Close button functionality
    if (closeBtn && editQualityModal) {
        closeBtn.onclick = () => { editQualityModal.style.display = 'none'; }; // Hide the modal on close
    } else {
        console.error("Modal or close button not found! Verify your element IDs.");
    }

    // Edit Quality Assurance form submission
    if (editQualityForm) {
        editQualityForm.onsubmit = (event) => {
            event.preventDefault(); // Prevent default form submission behavior

            const qualityData = {
                id: document.getElementById('provider_id')?.value || '', // Unique ID for the quality assurance entry
                name: document.getElementById('editName')?.value || '', // Personnel's name
                phone_no: document.getElementById('editPhone')?.value || '', // Phone number
                gender: document.getElementById('editGender')?.value || '', // Gender
                email: document.getElementById('editEmail')?.value || '', // Email address
                address: document.getElementById('editAddress')?.value || '', // Address
                company: document.getElementById('editCompany')?.value || '', // Company name
                role: document.getElementById('editRole')?.value || '', // Role in the company
                status: document.getElementById('editStatus')?.value || '', // Status
                registration_date: document.getElementById('editDate')?.value || '', // Date of entry
            };

            fetch(`/update-quality/${qualityData.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                   
                },
                body: JSON.stringify(qualityData),
            })
                .then(response => {
                    // Log the response for debugging
                    return response.text().then(text => {
                        console.log('Response:', text); // Log the raw response text
                        return { ok: response.ok, text }; // Return the response status and text
                    });
                })
                .then(({ ok, text }) => {
                    if (!ok) {
                        throw new Error(`Server responded with status ${text}`);
                    }
                    return JSON.parse(text); // Attempt to parse JSON if the response was okay
                })
                .then(data => {
                    if (data.success) {
                        alert('Quality Assurance entry updated successfully!');
                        editQualityModal.style.display = 'none';
                        fetchQualityAssurance();
                    } else {
                        alert('Error updating quality assurance entry: ' + data.message);
                    }
                })
                .catch(error => {
                    console.error('Error updating quality assurance entry:', error);
                    alert(`Failed to update quality assurance entry: ${error.message}`);
                });

        };
    } else {
        console.error("Form element with ID 'editQualityForm' not found."); // Log error if form not found
    }
}


document.addEventListener('DOMContentLoaded', fetchQualityAssurance);

//#endregio

//#region VOLUNTEER

//--------------------------------------------------------VOLUNTEER---------------------------------------------

function loadVolunteerContent() {
    console.log("Fetching volunteer content...");
    fetch('volunteers.css')
        .then(response => response.text())
        .then(css => {
            const style = document.createElement('style');
            style.innerHTML = css;
            document.head.appendChild(style);
        })
        .then(() => {
            fetch('/volunteer')
                .then(response => {
                    console.log("Response received:", response);
                    if (!response.ok) {
                        throw new Error('Network response was not ok');
                    }
                    return response.text();
                })
                .then(data => {
                    console.log("Data received:", data);
                    const mainContainer = document.querySelector('main');
                    mainContainer.innerHTML = data;

                    fetchVolunteers()
                    initializeVolunteerEvents()
                })
                .catch(error => {
                    console.error('There has been a problem with your fetch operation:', error);
                });
        });
}

// Function to fetch and display Volunteer data
function fetchVolunteers() {

    fetch('/fetch-volunteers',{
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',

        },
    }) // Make sure this matches the volunteers endpoint
        .then(response => {
            console.log('Response status:', response.status); // Log the response status
            return response.json(); // Directly parse the JSON response
        })
        .then(data => {
            console.log('Parsed JSON data:', data); // Log the parsed data

            const tableBody = document.querySelector('#volunteerTable tbody');
            if (!tableBody) {
                console.error('Table body not found!');
                return; // Exit if the table body is not found
            }
            tableBody.innerHTML = ''; // Clear any existing rows

            // Loop through the data and create table rows
            data.forEach(volunteer => {
                const row = document.createElement('tr'); // Create a new row
                row.innerHTML = `
                    <td>${volunteer.name}</td>
                    <td>${volunteer.phone_no}</td>
                    <td>${volunteer.gender}</td>
                    <td>${volunteer.email}</td>
                    <td>${volunteer.address}</td>
                    <td>${volunteer.role}</td>
                    <td>${new Date(volunteer.registration_date).toLocaleDateString()}</td>

                    <td>
                      <button class="edit-button" onclick='openEditVolunteerModal(${JSON.stringify(volunteer)})'>Edit</button>
                    </td>
                `;
                tableBody.appendChild(row); // Append the new row to the table body
            });
        })
        .catch(error => {
            console.error('Error fetching volunteer data:', error);
        });
}


// Open modal and fill the form with volunteer data
function openEditVolunteerModal(volunteer) {
    document.getElementById('volunteerId').value = volunteer.volunteer_id; // Ensure this is set correctly

    document.getElementById('volunteerId').value = volunteer.volunteer_id;
    document.getElementById('editName').value = volunteer.name;
    document.getElementById('editPhone').value = volunteer.phone_no;
    document.getElementById('editGender').value = volunteer.gender;
    document.getElementById('editEmail').value = volunteer.email;
    document.getElementById('editAddress').value = volunteer.address;
    document.getElementById('editRole').value = volunteer.role;

    // Format the date to YYYY-MM-DD format for the date input
    const date = new Date(volunteer.registration_date);
    const formattedDate = date.toISOString().split('T')[0];
    document.getElementById('editDate').value = formattedDate;

    // Display the modal
    document.getElementById('editVolunteerModal').style.display = 'block';
}

// Initialize event listeners after loading volunteer content
function initializeVolunteerEvents() {
    const closeBtn = document.getElementById('closeVolunteerModal'); 
    const editQualityModal = document.getElementById('editVolunteerModal');
    const editQualityForm = document.getElementById('editVolunteerForm'); 

    // Close button functionality
    if (closeBtn && editVolunteerModal) {
        closeBtn.onclick = () => { editVolunteerModal.style.display = 'none'; }; // Hide the modal on close
    } else {
        console.error("Modal or close button not found! Verify your element IDs.");
    }

    // Edit Quality Assurance form submission
    if (editVolunteerForm) {
        editVolunteerForm.onsubmit = (event) => {
            event.preventDefault(); // Prevent default form submission behavior

            const volunteerData = {
                volunteerId: document.getElementById('volunteerId')?.value || '', // Safely handle potential null values
                name: document.getElementById('editName')?.value || '',
                phone_no: document.getElementById('editPhone')?.value || '',
                gender: document.getElementById('editGender')?.value || '',
                email: document.getElementById('editEmail')?.value || '',
                address: document.getElementById('editAddress')?.value || '',
                company: document.getElementById('editCompany')?.value || '',
                role: document.getElementById('editRole')?.value || '',
                registration_date: document.getElementById('editDate')?.value || '',
            };

            fetch(`/update-volunteers/${volunteerData.volunteerId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                
                },
                body: JSON.stringify(volunteerData),
            })
                .then(response => {
                    // Log the response for debugging
                    return response.text().then(text => {
                        console.log('Response:', text); // Log the raw response text
                        return { ok: response.ok, text }; // Return the response status and text
                    });
                })
                .then(({ ok, text }) => {
                    if (!ok) {
                        throw new Error(`Server responded with status ${text}`);
                    }
                    return JSON.parse(text); // Attempt to parse JSON if the response was okay
                })
                .then(data => {
                    if (data.success) {
                        alert('Volunteer  entry updated successfully!');
                        editVolunteerModal.style.display = 'none';
                        fetchVolunteers();
                    } else {
                        alert('Error updating Volunteer  entry: ' + data.message);
                    }
                })
                .catch(error => {
                    console.error('Error updating Volunteer  entry:', error);
                    alert(`Failed to update Volunteer entry: ${error.message}`);
                    console.log(`Failed to update Volunteer entry: ${error.message}`)
                });

        };
    } else {
        console.error("Form element with ID 'editVolunteerForm' not found."); // Log error if form not found
    }
}


// Function to filter the volunteers  table based on search input and gender filter
function filterTable() {
    const searchInput = document.getElementById('searchInput').value.toLowerCase();
    const genderFilter = document.getElementById('genderFilter').value;

    const table = document.getElementById('volunteerTable');
    const rows = table.getElementsByTagName('tr');

    // Loop through table rows (excluding header row) to filter based on input
    for (let i = 1; i < rows.length; i++) { // Start at 1 to skip header row
        const row = rows[i];
        const name = row.cells[0].textContent.toLowerCase();
        const gender = row.cells[3].textContent;

        // Check if the row matches the search and gender filter criteria
        const matchesSearch = name.includes(searchInput);
        const matchesGender = genderFilter === '' || gender === genderFilter;

        // Show or hide the row based on filters
        if (matchesSearch && matchesGender) {
            row.style.display = ''; // Show row
        } else {
            row.style.display = 'none'; // Hide row
        }
    }
}

document.addEventListener('DOMContentLoaded', fetchVolunteers);


//#endregion

//#region LOGISTICS
//-----------------------------------------------------LOGISTICS------------------------------------------------
function loadLogisticsContent() {
    console.log("Fetching logistics content...");
    fetch('logistics.css')
        .then(response => response.text())
        .then(css => {
            const style = document.createElement('style');
            style.innerHTML = css;
            document.head.appendChild(style);
        })
        .then(() => {
            fetch('/logistics')
                .then(response => {
                    console.log("Response received:", response);
                    if (!response.ok) {
                        throw new Error('Network response was not ok');
                    }
                    return response.text();
                })
                .then(data => {
                    console.log("Data received:", data);
                    const mainContainer = document.querySelector('main');
                    mainContainer.innerHTML = data;

                    fetchLogisticsProviders();
                    initializeLogisticsHandler();
                })
                .catch(error => {
                    console.error('There has been a problem with your fetch operation:', error);
                });
        });
}

// Function to fetch and display Logistics Providers data
function fetchLogisticsProviders() {

   
    fetch('/logistics-providers',{
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        },
    }) // Make sure this matches the logistics providers endpoint
        .then(response => {
            console.log('Response status:', response.status); // Log the response status
            return response.json(); // Directly parse the JSON response
        })
        .then(data => {
            console.log('Parsed JSON data:', data); // Log the parsed data

            const tableBody = document.querySelector('#logisticsTable tbody');
            if (!tableBody) {
                console.error('Table body not found!');
                return; // Exit if the table body is not found
            }
            tableBody.innerHTML = ''; // Clear any existing rows

            // Loop through the data and create table rows
            data.forEach(logistics => {
                const row = document.createElement('tr'); // Create a new row
                row.innerHTML = `
                    <td>${logistics.name}</td>
                    <td>${logistics.phone_no}</td>
                    <td>${logistics.gender}</td>
                    <td>${logistics.email}</td>
                    <td>${logistics.address}</td>
                    <td>${logistics.company}</td>
                    <td>${logistics.status}</td>
                    <td>${new Date(logistics.registration_date).toLocaleDateString()}</td>

                    <td>
                      <button class="edit-button" onclick='openEditLogisticsModal(${JSON.stringify(logistics)})'>Edit</button>
                    </td>
                `;
                tableBody.appendChild(row); // Append the new row to the table body
            });
        })
        .catch(error => {
            console.error('Error fetching logistics data:', error);
        });
}

// Function to open the modal with logistics provider data
function openEditLogisticsModal(logistics) {
    document.getElementById('logisticsId').value = logistics.provider_id;
    document.getElementById('editName').value = logistics.name;
    document.getElementById('editPhone').value = logistics.phone_no;
    document.getElementById('editGender').value = logistics.gender;
    document.getElementById('editEmail').value = logistics.email;
    document.getElementById('editAddress').value = logistics.address;
    document.getElementById('editCompany').value = logistics.company;
    document.getElementById('editStatus').value = logistics.status;

   // Format the date to YYYY-MM-DD format for the date input
   const date = new Date(logistics.registration_date);
   const formattedDate = date.toISOString().split('T')[0];
   document.getElementById('editDate').value = formattedDate;

     // Display the modal
     document.getElementById('editLogisticsModal').style.display = 'block';
   
}

// Initialize event listeners after loading logistics provider content
function initializeLogisticsHandler() {
    const closeBtn = document.getElementById('closeLogisticsModal'); 
    const editLogisticsModal = document.getElementById('editLogisticsModal'); 
    const editLogisticsForm = document.getElementById('editLogisticsForm'); 

    // Close button functionality
    if (closeBtn && editLogisticsModal) {
        closeBtn.onclick = () => { editLogisticsModal.style.display = 'none'; }; // Hide the modal on close
    } else {
        console.error("Modal or close button not found! Verify your element IDs.");
    }

    // Edit Logistics Provider form submission
    if (editLogisticsForm) {
        editLogisticsForm.onsubmit = (event) => {
            event.preventDefault(); // Prevent default form submission behavior

            const logisticsData = {
                logisticsId: document.getElementById('logisticsId')?.value || '', // Safely handle potential null values
                name: document.getElementById('editName')?.value || '',
                phone_no: document.getElementById('editPhone')?.value || '',
                gender: document.getElementById('editGender')?.value || '',
                email: document.getElementById('editEmail')?.value || '',
                address: document.getElementById('editAddress')?.value || '',
                company: document.getElementById('editCompany')?.value || '',
                status: document.getElementById('editStatus')?.value || '',
                registration_date: document.getElementById('editDate')?.value || '',
            };

            fetch(`/update-logistics/${logisticsData.logisticsId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                  
                },
                body: JSON.stringify(logisticsData),
            })
                .then(response => {
                    // Log the response for debugging
                    return response.text().then(text => {
                        console.log('Response:', text); // Log the raw response text
                        return { ok: response.ok, text }; // Return the response status and text
                    });
                })
                .then(({ ok, text }) => {
                    if (!ok) {
                        throw new Error(`Server responded with status ${text}`);
                    }
                    return JSON.parse(text); // Attempt to parse JSON if the response was okay
                })
                .then(data => {
                    if (data.success) {
                        alert('Logistics provider entry updated successfully!');
                        editLogisticsModal.style.display = 'none';
                        fetchLogisticsProviders(); // Re-fetch the logistics data to reflect the changes
                    } else {
                        alert('Error updating logistics provider entry: ' + data.message);
                    }
                })
                .catch(error => {
                    console.error('Error updating logistics provider entry:', error);
                    alert(`Failed to update logistics provider entry: ${error.message}`);
                    console.log(`Failed to update logistics provider entry: ${error.message}`);
                });

        };
    } else {
        console.error("Form element with ID 'editLogisticsForm' not found."); // Log error if form not found
    }
}

document.addEventListener('DOMContentLoaded', fetchLogisticsProviders);

//#endregion



//-----------------------------------------------------------// Endpoint to fetch food types----------------------------------





// Optional: Trigger search on pressing Enter key inside the search input
document.getElementById('searchInput').addEventListener('keypress', function (event) {
    if (event.key === 'Enter') {
        filterTable(); // Trigger search
    }
});