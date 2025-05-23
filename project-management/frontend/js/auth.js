// Constants
const API_URL = 'http://localhost:8080/api';
const TOKEN_KEY = 'auth-token';
const USER_KEY = 'user-info';

// Check if user is logged in and redirect accordingly
function checkAuth() {
    const token = localStorage.getItem('auth-token');
    const currentPage = window.location.pathname.split('/').pop();
    
    // Restricted pages that require authentication
    const restrictedPages = ['dashboard.html', 'project-details.html', 'task-management.html'];
    // Public pages
    const publicPages = ['login.html', 'register.html', 'index.html', ''];
    
    if (!token && restrictedPages.includes(currentPage)) {
        // Redirect to login if on a restricted page and no token
        window.location.href = 'login.html';
        return false;
    }
    
    // Show/hide leader-specific UI elements if user is logged in
    if (token) {
        const user = JSON.parse(localStorage.getItem('user-info'));
        if (user && user.roles.includes('ROLE_LEADER')) {
            // Show leader-specific elements
            document.querySelectorAll('.leader-only').forEach(el => {
                el.style.display = 'block';
            });
        }
        return true;
    }
    
    return false;
}

// Add this function to auth.js
function checkTokenValidity() {
    const token = localStorage.getItem(TOKEN_KEY);
    
    // If no token exists, redirect to login page
    if (!token) {
        window.location.href = 'login.html';
        return false;
    }
    
    // Check if token is expired (if your token contains expiry info)
    try {
        // For JWT tokens, you can check expiration
        const payload = JSON.parse(atob(token.split('.')[1]));
        if (payload.exp && payload.exp * 1000 < Date.now()) {
            // Token expired
            localStorage.removeItem(TOKEN_KEY);
            localStorage.removeItem(USER_KEY);
            window.location.href = 'login.html';
            return false;
        }
    } catch (e) {
        // Invalid token format
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
        window.location.href = 'login.html';
        return false;
    }
    
    return true;
}

// Handle login form submission
function setupLoginForm() {
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;
            
            try {
                const response = await fetch(`${API_URL}/auth/signin`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ username, password })
                });
                
                const data = await response.json();
                
                if (response.ok) {
                    // Store token and user info
                    localStorage.setItem(TOKEN_KEY, data.token);
                    localStorage.setItem(USER_KEY, JSON.stringify(data));
                    
                    // Redirect to dashboard
                    window.location.href = 'dashboard.html';
                } else {
                    showAlert('alert-danger', data.message || 'Login failed. Please check your credentials.');
                }
            } catch (error) {
                showAlert('alert-danger', 'An error occurred. Please try again later.');
                console.error('Login error:', error);
            }
        });
    }
}

// Handle registration form submission
function setupRegisterForm() {
    const registerForm = document.getElementById('register-form');
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const username = document.getElementById('username').value;
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const confirmPassword = document.getElementById('confirmPassword').value;
            const fullName = document.getElementById('fullName')?.value || '';
            const roleValue = document.querySelector('input[name="role"]:checked').value;
            
            // Validate passwords match
            if (password !== confirmPassword) {
                showAlert('alert-danger', 'Passwords do not match.');
                return;
            }
            
            // Extract the role name without the ROLE_ prefix
            const role = roleValue.replace('ROLE_', '').toLowerCase();
            
            try {
                const response = await fetch(`${API_URL}/auth/signup`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        username,
                        email,
                        password,
                        fullName,
                        roles: [role]  // Now sending 'leader' or 'member', not 'role_leader' or 'role_member'
                    })
                });
                
                const data = await response.json();
                
                if (response.ok) {
                    showAlert('alert-success', 'Registration successful! You can now login.');
                    // Clear form
                    registerForm.reset();
                    // Redirect to login page after 2 seconds
                    setTimeout(() => {
                        window.location.href = 'login.html';
                    }, 2000);
                } else {
                    showAlert('alert-danger', data.message || 'Registration failed.');
                }
            } catch (error) {
                showAlert('alert-danger', 'An error occurred. Please try again later.');
                console.error('Registration error:', error);
            }
        });
    }
}

// Handle logout
function setupLogout() {
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            
            // Clear authentication data
            localStorage.removeItem(TOKEN_KEY);
            localStorage.removeItem(USER_KEY);
            
            // Redirect to login page
            window.location.href = 'login.html';
        });
    }
}

// Utility function to show alerts
function showAlert(type, message) {
    const alertContainer = document.getElementById('alert-container');
    if (alertContainer) {
        alertContainer.innerHTML = `
            <div class="alert ${type}">
                ${message}
            </div>
        `;
        
        // Auto dismiss alert after 5 seconds
        setTimeout(() => {
            alertContainer.innerHTML = '';
        }, 5000);
    }
}

// Helper function to get auth headers
function getAuthHeaders() {
    const token = localStorage.getItem(TOKEN_KEY);
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };
}

// Helper function to get current user
function getCurrentUser() {
    const userJson = localStorage.getItem(USER_KEY);
    return userJson ? JSON.parse(userJson) : null;
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    // Check authentication
    checkAuth();
    
    // Setup forms
    setupLoginForm();
    setupRegisterForm();
    
    // Setup logout
    setupLogout();
    
    // Setup create project modal triggers if on dashboard
    const createProjectBtn = document.getElementById('create-project-btn');
    const newProjectBtn = document.getElementById('new-project-btn');
    
    if (createProjectBtn || newProjectBtn) {
        const openCreateProjectModal = () => {
            document.getElementById('create-project-modal').classList.add('show');
            document.getElementById('modal-backdrop').classList.add('show');
        };
        
        if (createProjectBtn) {
            createProjectBtn.addEventListener('click', (e) => {
                e.preventDefault();
                openCreateProjectModal();
            });
        }
        
        if (newProjectBtn) {
            newProjectBtn.addEventListener('click', openCreateProjectModal);
        }
        
        // Close modal
        document.getElementById('close-create-project-modal')?.addEventListener('click', () => {
            document.getElementById('create-project-modal').classList.remove('show');
            document.getElementById('modal-backdrop').classList.remove('show');
        });
        
        document.getElementById('cancel-create-project')?.addEventListener('click', () => {
            document.getElementById('create-project-modal').classList.remove('show');
            document.getElementById('modal-backdrop').classList.remove('show');
        });
    }
});

