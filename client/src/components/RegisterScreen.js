// src/components/RegisterScreen.js
import React, { useState } from 'react';
import { api } from '../services/api';

const RegisterScreen = ({ onRegisterSuccess, onNavigateToLogin }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setIsLoading(true);
        try {
            const data = await api.register(username, password);
            setSuccess(data.msg + ' You can now log in.');
            setTimeout(onRegisterSuccess, 2000);
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen">
            <div className="w-full max-w-md p-8 space-y-6 bg-gray-800 rounded-lg shadow-lg">
                <h1 className="text-3xl font-bold text-center text-cyan-400">Register</h1>
                <form onSubmit={handleSubmit} className="space-y-6">
                    {error && <p className="text-red-400 bg-red-500/20 p-3 rounded-md text-center">{error}</p>}
                    {success && <p className="text-green-400 bg-green-500/20 p-3 rounded-md text-center">{success}</p>}
                    <input
                        type="text"
                        placeholder="Username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500"
                        required
                    />
                    <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500"
                        required
                    />
                    <button type="submit" disabled={isLoading} className="w-full px-4 py-2 font-bold text-white bg-cyan-600 rounded-md hover:bg-cyan-500 disabled:bg-gray-500 transition-colors">
                        {isLoading ? 'Registering...' : 'Register'}
                    </button>
                </form>
                 <p className="text-center text-gray-400">
                    Already have an account?{' '}
                    <button onClick={onNavigateToLogin} className="font-medium text-cyan-400 hover:underline">
                        Login
                    </button>
                </p>
            </div>
        </div>
    );
};

export default RegisterScreen;