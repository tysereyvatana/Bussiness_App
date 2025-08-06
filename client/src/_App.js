// client/src/App.js
import React, { useState, useEffect, useCallback } from 'react'; // Import useCallback
import LoginScreen from './components/LoginScreen';
import RegisterScreen from './components/RegisterScreen';
import ChatApp from './components/ChatApp';
import AlertModal from './components/AlertModal';

const App = () => {
    const [token, setToken] = useState(localStorage.getItem('token'));
    const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')));
    const [view, setView] = useState(token && user ? 'chat' : 'login');
    const [alertInfo, setAlertInfo] = useState({ isOpen: false, message: '' });

    // For user-initiated logouts (clears storage for all tabs)
    const handleLogout = useCallback(() => {
        console.log('Handling user-initiated logout...');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setToken(null);
        setUser(null);
        setView('login');
    }, []);

    // ✨ NEW: For forced logouts (resets state without clearing storage)
    const handleForcedLogout = useCallback(() => {
        console.log('Handling forced logout...');
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
        setView('chat');
    };

    const showAlertAndLogout = (message) => {
        setAlertInfo({
            isOpen: true,
            message: message,
        });
    };

    useEffect(() => {
        const handleStorageChange = (e) => {
            if (e.key === 'token' && e.newValue === null) {
                console.log('Token removed by another tab. Forcing state reset.');
                handleForcedLogout();
            }
        };
        
        window.addEventListener('storage', handleStorageChange);

        return () => {
            window.removeEventListener('storage', handleStorageChange);
        };
    }, [handleForcedLogout]);

    const renderView = () => {
        switch(view) {
            case 'chat':
                return <ChatApp currentUser={user} token={token} onLogout={handleLogout} onForceLogout={showAlertAndLogout} />;
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
            <AlertModal
                isOpen={alertInfo.isOpen}
                message={alertInfo.message}
                // ✨ CHANGE: Call the new handler when the modal is closed
                onClose={handleForcedLogout}
            />
        </div>
    );
};

export default App;