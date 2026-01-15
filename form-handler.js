// Google Apps Script Web App URL
// REPLACE THIS WITH YOUR OWN GOOGLE APPS SCRIPT DEPLOYMENT URL
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwIBnW1AyNovvo1AXfwdG3p_Py7EMN5GRnyC35neSCRFhZBtUTB0PjBRJaCJvRqPRc/exec';

// DOM Elements
const contactForm = document.getElementById('contactForm');
const submitBtn = document.getElementById('submitBtn');
const btnText = submitBtn.querySelector('.btn-text');
const loadingSpinner = submitBtn.querySelector('.loading-spinner');
const formMessage = document.getElementById('formMessage');

// Form validation
function validateForm() {
    let isValid = true;
    
    // Clear previous error messages
    document.querySelectorAll('.error-message').forEach(el => {
        el.textContent = '';
    });
    
    // Name validation
    const name = document.getElementById('name').value.trim();
    if (!name) {
        document.getElementById('nameError').textContent = 'Name is required';
        isValid = false;
    } else if (name.length < 2) {
        document.getElementById('nameError').textContent = 'Name must be at least 2 characters';
        isValid = false;
    }
    
    // Email validation
    const email = document.getElementById('email').value.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
        document.getElementById('emailError').textContent = 'Email is required';
        isValid = false;
    } else if (!emailRegex.test(email)) {
        document.getElementById('emailError').textContent = 'Please enter a valid email address';
        isValid = false;
    }
    
    // Phone validation (optional)
    const phone = document.getElementById('phone').value.trim();
    if (phone) {
        const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
        if (!phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''))) {
            document.getElementById('phoneError').textContent = 'Please enter a valid phone number';
            isValid = false;
        }
    }
    
    // Subject validation
    const subject = document.getElementById('subject').value;
    if (!subject) {
        document.getElementById('subjectError').textContent = 'Please select a subject';
        isValid = false;
    }
    
    // Message validation
    const message = document.getElementById('message').value.trim();
    if (!message) {
        document.getElementById('messageError').textContent = 'Message is required';
        isValid = false;
    } else if (message.length < 10) {
        document.getElementById('messageError').textContent = 'Message must be at least 10 characters';
        isValid = false;
    }
    
    return isValid;
}

// Show loading state
function showLoading() {
    btnText.style.display = 'none';
    loadingSpinner.style.display = 'flex';
    submitBtn.disabled = true;
}

// Hide loading state
function hideLoading() {
    btnText.style.display = 'inline';
    loadingSpinner.style.display = 'none';
    submitBtn.disabled = false;
}

// Show form message
function showMessage(type, text) {
    formMessage.className = `form-message ${type}`;
    formMessage.textContent = text;
    formMessage.style.display = 'block';
    
    // Scroll to message
    formMessage.scrollIntoView({ behavior: 'smooth', block: 'center' });
    
    // Hide message after 5 seconds (only for success)
    if (type === 'success') {
        setTimeout(() => {
            formMessage.style.display = 'none';
        }, 5000);
    }
}

// Reset form
function resetForm() {
    contactForm.reset();
}

// Form submission handler
contactForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Validate form
    if (!validateForm()) {
        showMessage('error', 'Please fix the errors in the form.');
        return;
    }
    
    // Prepare form data
    const formData = {
        timestamp: new Date().toISOString(),
        name: document.getElementById('name').value.trim(),
        email: document.getElementById('email').value.trim(),
        phone: document.getElementById('phone').value.trim() || 'Not provided',
        subject: document.getElementById('subject').value,
        message: document.getElementById('message').value.trim(),
        newsletter: document.getElementById('newsletter').checked ? 'Yes' : 'No'
    };
    
    // Show loading state
    showLoading();
    
    try {
        // Send data to Google Sheets via Google Apps Script
        const response = await fetch(GOOGLE_SCRIPT_URL, {
            method: 'POST',
            mode: 'no-cors', // Important for Google Apps Script
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData)
        });
        
        // Note: With 'no-cors' mode, we can't read the response
        // So we assume success if no network error occurs
        showMessage('success', 'Thank you! Your message has been sent successfully. We\'ll get back to you soon.');
        resetForm();
        
        // Log to console for debugging (in real scenario, you'd have proper error handling)
        console.log('Form submitted successfully:', formData);
        
    } catch (error) {
        console.error('Error submitting form:', error);
        showMessage('error', 'Sorry, there was an error submitting your form. Please try again later or contact us directly.');
    } finally {
        hideLoading();
    }
});

// Real-time validation
document.querySelectorAll('#contactForm input, #contactForm select, #contactForm textarea').forEach(input => {
    input.addEventListener('blur', () => {
        validateForm();
    });
});

// Phone number formatting
document.getElementById('phone').addEventListener('input', function(e) {
    let value = e.target.value.replace(/\D/g, '');
    
    if (value.length > 0) {
        if (value.length <= 3) {
            value = value;
        } else if (value.length <= 6) {
            value = `(${value.substring(0,3)}) ${value.substring(3)}`;
        } else {
            value = `(${value.substring(0,3)}) ${value.substring(3,6)}-${value.substring(6,10)}`;
        }
    }
    
    e.target.value = value;
});