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

const App = () => {
    // Initialize state to null. The initial session will be loaded in an effect.
    const [token, setToken] = useState(null);
    const [user, setUser] = useState(null);
    const [view, setView] = useState('login'); // Default to 'login' view
    const [alertInfo, setAlertInfo] = useState({ isOpen: false, message: '' });
    const socketRef = useRef(null);

    // This effect runs once on component mount to check for an existing session.
    useEffect(() => {
        const storedToken = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');
        if (storedToken && storedUser) {
            setToken(storedToken);
            setUser(JSON.parse(storedUser));
            setView('dashboard'); // If session exists, go to dashboard
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
            console.log('[App.js] Token found, establishing global socket connection...');
            socketRef.current = io('http://localhost:5000', { auth: { token } });
            const socket = socketRef.current;

            socket.on('connect', () => console.log(`%c[Socket] App.js Connected: ${socket.id}`, 'color: #00ff00;'));
            
            socket.on('force_logout', (data) => {
                console.log(`%c[App.js] Received 'force_logout': ${data.msg}`, 'color: #ffa500; font-weight: bold;');
                showAlert(data.msg);
            });

            return () => {
                console.log('[App.js] Token removed, disconnecting socket.');
                socket.disconnect();
            };
        }
    }, [token]);

    // Effect for handling storage events (syncing tabs in the same browser).
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
                // Pass the socket instance to the CustomerPage for real-time updates.
                return <CustomerPage socket={socketRef.current} />;
            case 'chat':
                // Pass the socket instance to the ChatApp.
                return <ChatApp currentUser={user} socket={socketRef.current} />;
            case 'dashboard':
            default:
                return <Dashboard currentUser={user} />;
        }
    };

    return (
        <div className="bg-gray-900 text-white min-h-screen font-sans antialiased">
            {token && user ? (
                // If logged in, show the MainLayout
                <MainLayout currentUser={user} activeView={view} onNavigate={setView} onLogout={handleGlobalLogout}>
                    {renderMainContent()}
                </MainLayout>
            ) : (
                // If logged out, switch between Login and Register screens
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
