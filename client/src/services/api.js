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
        window.dispatchEvent(new Event('force-logout'));
        throw new Error('Session expired. Please log in again.');
    }
    if (!res.ok) {
        const errorData = await res.json().catch(() => ({ msg: 'An unknown API error occurred' }));
        throw new Error(errorData.msg || 'An API error occurred');
    }
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
        headers: getAuthHeaders(),
        body: JSON.stringify(userData),
    }),

    // --- Customer Functions ---
    getCustomers: (searchTerm = '') => {
        const url = searchTerm 
            ? `${API_URL}/customers?search=${encodeURIComponent(searchTerm)}` 
            : `${API_URL}/customers`;
        return apiFetch(url, { headers: getAuthHeaders() });
    },
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

    // --- Message Functions ---
    getMessages: () => apiFetch(`${API_URL}/messages`, {
        headers: getAuthHeaders(),
    }),
    postMessage: (message) => apiFetch(`${API_URL}/messages`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(message),
    }),

    // --- Service Functions ---
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

    // --- User Management Functions ---
    getUsers: (searchTerm = '') => {
        const url = searchTerm 
            ? `${API_URL}/users?search=${encodeURIComponent(searchTerm)}` 
            : `${API_URL}/users`;
        return apiFetch(url, { headers: getAuthHeaders() });
    },
    updateUser: (id, userData) => apiFetch(`${API_URL}/users/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(userData),
    }),
    deleteUser: (id) => apiFetch(`${API_URL}/users/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
    }),
    getUserRoles: () => apiFetch(`${API_URL}/users/roles`, { headers: getAuthHeaders() }),
    getUserStatuses: () => apiFetch(`${API_URL}/users/statuses`, { headers: getAuthHeaders() }),

    // --- Statistics and Activity Functions ---
    getDashboardStats: () => apiFetch(`${API_URL}/statistics`, {
       headers: getAuthHeaders(),
    }),
    getActivities: () => apiFetch(`${API_URL}/activities`, {
        headers: getAuthHeaders(),
    }),

    // --- Repair Job Functions ---
    getRepairJobs: (searchTerm = '') => {
        const url = searchTerm 
            ? `${API_URL}/repair-jobs?search=${encodeURIComponent(searchTerm)}` 
            : `${API_URL}/repair-jobs`;
        return apiFetch(url, { headers: getAuthHeaders() });
    },
    addRepairJob: (jobData) => apiFetch(`${API_URL}/repair-jobs`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(jobData),
    }),
    updateRepairJob: (id, jobData) => apiFetch(`${API_URL}/repair-jobs/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(jobData),
    }),
    deleteRepairJob: (id) => apiFetch(`${API_URL}/repair-jobs/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
    }),

    // --- CORRECTED: Item Brand Functions ---
    getItemBrands: (searchTerm = '') => {
        const url = searchTerm 
            ? `${API_URL}/item-brands?search=${encodeURIComponent(searchTerm)}` 
            : `${API_URL}/item-brands`;
        return apiFetch(url, { headers: getAuthHeaders() });
    },
    addItemBrand: (brandData) => apiFetch(`${API_URL}/item-brands`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(brandData),
    }),
    updateItemBrand: (id, brandData) => apiFetch(`${API_URL}/item-brands/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(brandData),
    }),
    deleteItemBrand: (id) => apiFetch(`${API_URL}/item-brands/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
    }),
};
