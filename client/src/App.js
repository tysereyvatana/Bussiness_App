import React, { useState, useEffect, useCallback, useRef } from 'react';
import { io } from 'socket.io-client';

// --- Page & Layout Components ---
import LoginScreen from './components/LoginScreen';
import RegisterScreen from './components/RegisterScreen';
import ChatApp from './components/ChatApp';
import CustomerPage from './components/CustomerPage';
import Dashboard from './components/Dashboard';
import MainLayout from './components/MainLayout';
import AlertModal from './components/AlertModal';
import ServicePage from './components/ServicePage';
import UserManagementPage from './components/UserManagementPage'; // <-- ADD THIS IMPORT

const App = () => {
    const [token, setToken] = useState(null);
    const [user, setUser] = useState(null);
    const [view, setView] = useState('login');
    const [alertInfo, setAlertInfo] = useState({ isOpen: false, message: '' });
    const socketRef = useRef(null);

    useEffect(() => {
        const storedToken = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');
        if (storedToken && storedUser) {
            setToken(storedToken);
            setUser(JSON.parse(storedUser));
            setView('dashboard');
        }
    }, []);

    // --- Authentication & State Management ---
    const handleGlobalLogout = useCallback(() => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setToken(null);
        setUser(null);
        setView('login');
    }, []);

    const handleForcedLogout = useCallback(() => {
        setToken(null);
        setUser(null);
        setView('login');
        setAlertInfo({ isOpen: false, message: '' });
    }, []);

    const handleLogin = (data) => {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        setToken(data.token);
        setUser(data.user);
        setView('dashboard');
    };
    
    const showAlert = (message) => {
        setAlertInfo({ isOpen: true, message: message });
    };

    // --- Top-Level Effect for Socket Connection ---
    useEffect(() => {
        if (token) {
            socketRef.current = io('http://localhost:5000', { auth: { token } });
            const socket = socketRef.current;
            socket.on('connect', () => console.log(`%c[Socket] App.js Connected: ${socket.id}`, 'color: #00ff00;'));
            socket.on('force_logout', (data) => {
                showAlert(data.msg);
            });
            return () => {
                socket.disconnect();
            };
        }
    }, [token]);

    useEffect(() => {
        const handleStorageChange = (e) => {
            if (e.key === 'token' && e.newValue === null) {
                handleForcedLogout();
            }
        };
        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, [handleForcedLogout]);

    // --- View Rendering Logic ---
    const renderMainContent = () => {
        switch(view) {
            case 'customers':
                // Pass the current user object to the CustomerPage
                return <CustomerPage socket={socketRef.current} currentUser={user} />;
            case 'services':
                 // Pass the current user object to the ServicePage
                return <ServicePage socket={socketRef.current} currentUser={user} />;
            case 'users': // <-- ADD THIS CASE
                return <UserManagementPage socket={socketRef.current} currentUser={user} />;
            case 'chat':
                return <ChatApp currentUser={user} socket={socketRef.current} />;
            case 'dashboard':
                default:
                // Pass the socket instance to the Dashboard for real-time updates.
                    return <Dashboard currentUser={user} socket={socketRef.current} />;
        }
    };

    return (
        <div className="bg-gray-900 text-white min-h-screen font-sans antialiased">
            {token && user ? (
                <MainLayout currentUser={user} activeView={view} onNavigate={setView} onLogout={handleGlobalLogout}>
                    {renderMainContent()}
                </MainLayout>
            ) : (
                view === 'register' ? (
                    <RegisterScreen 
                        onRegisterSuccess={() => setView('login')} 
                        onNavigateToLogin={() => setView('login')} 
                    />
                ) : (
                    <LoginScreen 
                        onLoginSuccess={handleLogin} 
                        onNavigateToRegister={() => setView('register')} 
                    />
                )
            )}
            <AlertModal isOpen={alertInfo.isOpen} message={alertInfo.message} onClose={handleForcedLogout} />
        </div>
    );
};

export default App;
