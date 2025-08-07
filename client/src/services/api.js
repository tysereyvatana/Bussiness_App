// src/services/api.js

const API_URL = 'http://localhost:5000/api'; // Ensure this port matches your server

/**
 * A helper function to get the authorization headers.
 * @returns {object} - The headers object with the x-auth-token.
 */
const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
        'Content-Type': 'application/json',
        'x-auth-token': token,
    };
};

/**
 * A wrapper for the fetch API that automatically handles 401 Unauthorized errors
 * by dispatching a 'force-logout' event. This allows the UI to react globally
 * to session expirations.
 * @param {string} url - The URL to fetch.
 * @param {object} options - The options for the fetch request.
 * @returns {Promise<any>} - The JSON response from the API.
 */
const apiFetch = async (url, options = {}) => {
    const res = await fetch(url, options);
    if (res.status === 401) {
        // This means the token is invalid, likely due to a login elsewhere or expiration.
        // We'll trigger a custom event that the App.js can listen for to force a logout.
        window.dispatchEvent(new Event('force-logout'));
        throw new Error('Session expired. Please log in again.');
    }
    if (!res.ok) {
        const errorData = await res.json().catch(() => ({ msg: 'An unknown API error occurred' }));
        throw new Error(errorData.msg || 'An API error occurred');
    }
    // Handle responses that might not have a body, like a 204 No Content
    if (res.status === 204) {
        return null;
    }
    return res.json();
};

// A single object containing all our API methods, which we will export.
export const api = {
    // --- Auth Functions ---
    login: (userData) => apiFetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
    }),
    register: (userData) => apiFetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
    }),

    // --- Customer Functions ---
    getCustomers: () => apiFetch(`${API_URL}/customers`, {
        headers: getAuthHeaders(),
    }),
    addCustomer: (customerData) => apiFetch(`${API_URL}/customers`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(customerData),
    }),
    updateCustomer: (id, customerData) => apiFetch(`${API_URL}/customers/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(customerData),
    }),
    deleteCustomer: (id) => apiFetch(`${API_URL}/customers/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
    }),
    // --- UPDATE THIS FUNCTION ---
    getCustomers: (searchTerm = '') => {
        // Append the search term as a query parameter if it exists
        const url = searchTerm 
            ? `${API_URL}/customers?search=${encodeURIComponent(searchTerm)}` 
            : `${API_URL}/customers`;
        
        return apiFetch(url, {
            headers: getAuthHeaders(),
        });
    },
    // --- Message Functions ---
    getMessages: () => apiFetch(`${API_URL}/messages`, {
        headers: getAuthHeaders(),
    }),
    postMessage: (message) => apiFetch(`${API_URL}/messages`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(message),
    }),
    // --- ADD THIS SECTION: Service Functions ---
    getServices: (searchTerm = '') => {
        const url = searchTerm 
            ? `${API_URL}/services?search=${encodeURIComponent(searchTerm)}` 
            : `${API_URL}/services`;
        return apiFetch(url, { headers: getAuthHeaders() });
    },
    addService: (serviceData) => apiFetch(`${API_URL}/services`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(serviceData),
    }),
    updateService: (id, serviceData) => apiFetch(`${API_URL}/services/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(serviceData),
    }),
    deleteService: (id) => apiFetch(`${API_URL}/services/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
    }),
    // --- ADD THIS SECTION: User Management Functions ---
    getUsers: (searchTerm = '') => {
        const url = searchTerm 
            ? `${API_URL}/users?search=${encodeURIComponent(searchTerm)}` 
            : `${API_URL}/users`;
        return apiFetch(url, { headers: getAuthHeaders() });
    },
    // Note: Adding a new user still goes through the 'register' endpoint
    updateUser: (id, userData) => apiFetch(`${API_URL}/users/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(userData),
    }),
    deleteUser: (id) => apiFetch(`${API_URL}/users/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
    }),
    // --- UPDATE THIS FUNCTION ---
    // The register function is now used for creating new users by an admin,
    // so it must send the admin's authentication token.
    register: (userData) => apiFetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: getAuthHeaders(), // <-- This line was missing
        body: JSON.stringify(userData),
    }),    
    // --- ADD THESE NEW FUNCTIONS ---
    getUserRoles: () => apiFetch(`${API_URL}/users/roles`, { headers: getAuthHeaders() }),
    getUserStatuses: () => apiFetch(`${API_URL}/users/statuses`, { headers: getAuthHeaders() }),
      // --- ADD THIS NEW FUNCTION ---
    getDashboardStats: () => apiFetch(`${API_URL}/statistics`, {
       headers: getAuthHeaders(),
    }),
    // --- ADD THIS NEW FUNCTION ---
    getActivities: () => apiFetch(`${API_URL}/activities`, {
        headers: getAuthHeaders(),
    }),
};
