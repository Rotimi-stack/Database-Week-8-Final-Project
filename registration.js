document.addEventListener('DOMContentLoaded', function () {
    const registrationForm = document.getElementById('contactForm');

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (registrationForm) {
        registrationForm.addEventListener('submit', function (event) {
            event.preventDefault(); // Prevent default submission

            clearErrors(); // Clear previous error messages

            const fname = document.getElementById('firstName').value.trim();
            const lname = document.getElementById('lastName').value.trim();
            const email = document.getElementById('email').value.trim();
            const password = document.getElementById('password').value.trim();
            const confirmPassword = document.getElementById('confirm_password').value.trim();
            const phone = document.getElementById('phone').value.trim();
            const address = document.getElementById('address').value.trim();
            const dob = document.getElementById('dob').value.trim();
            const country = document.getElementById('country');
            const countryValue = country.value;
            const terms = document.getElementById('terms').checked;
            const gender = document.querySelector('input[name="gender"]:checked');

            let valid = true;

            // Validation checks
            if (fname === "") {
                displayError('firstName', 'First Name is required'); // Use correct ID
                valid = false;
            }
            if (lname === "") {
                displayError('lastName', 'Last Name is required'); // Use correct ID
                valid = false;
            }
            if (email === "") {
                displayError('email', 'Email is required'); // Use correct ID
                valid = false;
            } else if (!emailPattern.test(email)) {
                displayError('email', 'Please enter a valid email address'); // Use correct ID
                valid = false;
            }
            if (password.length < 8) {
                displayError('password', 'Password must be at least 8 characters long'); // Use correct ID
                valid = false;
            }
            if (confirmPassword !== password) {
                displayError('confirm_password', 'Passwords do not match'); // Use correct ID
                valid = false;
            }
            if (phone === "") {
                displayError('phone', 'Phone No is required'); // Use correct ID
                valid = false;
            }
            if (address === "") {
                displayError('address', 'Address is required'); // Use correct ID
                valid = false;
            }
            if (dob === "") {
                displayError('dob', 'Date of Birth is required'); // Use correct ID
                valid = false;
            }
            if (countryValue === "") {
                displayError('country', 'Please select a country'); // Use correct ID
                valid = false;
            }
            if (!terms) {
                displayError('terms', 'Accept terms and conditions'); // Use correct ID
                valid = false;
            }
            if (!gender) {
                displayError('gender', 'Please select a gender'); // Use correct ID
                valid = false;
            }

            // If valid, submit the form
            if (valid) {
                registrationForm.submit(); // This will submit the form if valid
            }
        });
    }

    function clearErrors() {
        const errorElements = document.querySelectorAll('.error-message');
        errorElements.forEach(element => element.remove());
    }
    
    function displayError(fieldId, message) {
        const field = document.getElementById(fieldId);
        const errorMessage = document.createElement('div');
        errorMessage.className = 'error-message';
        errorMessage.style.color = 'red'; // Style the error message
        errorMessage.textContent = message;
        field.parentElement.insertBefore(errorMessage, field.nextSibling);
    }
});
