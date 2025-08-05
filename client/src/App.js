import React, { useState, useEffect } from 'react';
import LoginScreen from './components/LoginScreen';
import RegisterScreen from './components/RegisterScreen';
import ChatApp from './components/ChatApp';

const App = () => {
    const [token, setToken] = useState(localStorage.getItem('token'));
    const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')));
    const [view, setView] = useState(token && user ? 'chat' : 'login');

    const handleLogout = () => {
        console.log('Handling logout...');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setToken(null);
        setUser(null);
        setView('login');
    };

    const handleLogin = (data) => {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        setToken(data.token);
        setUser(data.user);
        setView('chat');
    };

    useEffect(() => {
        const handleStorageChange = (e) => {
            if (e.key === 'token' && e.newValue === null) {
                console.log('Token removed from storage. Logging out this tab.');
                handleLogout();
            }
        };
        
        window.addEventListener('storage', handleStorageChange);

        return () => {
            window.removeEventListener('storage', handleStorageChange);
        }
    }, []);

    const renderView = () => {
        switch(view) {
            case 'chat':
                return <ChatApp currentUser={user} token={token} onLogout={handleLogout} />;
            case 'register':
                return <RegisterScreen onRegisterSuccess={() => setView('login')} onNavigateToLogin={() => setView('login')} />;
            case 'login':
            default:
                return <LoginScreen onLoginSuccess={handleLogin} onNavigateToRegister={() => setView('register')} />;
        }
    };

    return (
        <div className="bg-gray-900 text-white min-h-screen font-sans antialiased">
            {renderView()}
        </div>
    );
};

export default App;
