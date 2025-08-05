// src/services/api.js

const API_URL = 'http://localhost:5000/api'; // Ensure this port matches your server's .env file

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
        const errorData = await res.json();
        throw new Error(errorData.msg || 'An API error occurred');
    }
    return res.json();
};

export const api = {
    login: (username, password) => apiFetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
    }),
    register: (username, password) => apiFetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
    }),
    getMessages: (token) => apiFetch(`${API_URL}/messages`, {
        headers: { 'x-auth-token': token },
    }),
    postMessage: (message, token) => apiFetch(`${API_URL}/messages`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-auth-token': token,
        },
        body: JSON.stringify(message),
    }),
};
