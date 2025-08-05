// src/components/LoginScreen.js
import React, { useState } from 'react';
import { api } from '../services/api';

const LoginScreen = ({ onLoginSuccess, onNavigateToRegister }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        try {
            // It calls the api.login function from our services file
            const data = await api.login(username, password);
            // If successful, it calls the onLoginSuccess function passed from App.js
            onLoginSuccess(data);
        } catch (err) {
            // If there's an error from the API, it displays it
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-900">
            <div className="w-full max-w-md p-8 space-y-6 bg-gray-800 rounded-lg shadow-lg">
                <h1 className="text-3xl font-bold text-center text-cyan-400">Login</h1>
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* This is where error messages will be displayed */}
                    {error && <p className="text-red-400 bg-red-500/20 p-3 rounded-md text-center">{error}</p>}
                    
                    {/* Username Input */}
                    <input
                        type="text"
                        placeholder="Username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="w-full px-4 py-2 text-white bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500"
                        required
                    />

                    {/* Password Input */}
                    <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full px-4 py-2 text-white bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500"
                        required
                    />

                    {/* Submit Button */}
                    <button type="submit" disabled={isLoading} className="w-full px-4 py-2 font-bold text-white bg-cyan-600 rounded-md hover:bg-cyan-500 disabled:bg-gray-500 transition-colors">
                        {isLoading ? 'Logging in...' : 'Login'}
                    </button>
                </form>
                <p className="text-center text-gray-400">
                    Don't have an account?{' '}
                    <button onClick={onNavigateToRegister} className="font-medium text-cyan-400 hover:underline">
                        Register
                    </button>
                </p>
            </div>
        </div>
    );
};

export default LoginScreen;
