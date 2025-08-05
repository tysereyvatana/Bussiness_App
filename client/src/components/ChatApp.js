import React, { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

const ChatApp = ({ currentUser, token, onLogout }) => {
    const socketRef = useRef(null);

    useEffect(() => {
        // Establish the socket connection when the component mounts.
        // We pass the token here for the server to identify the user.
        socketRef.current = io('http://localhost:5000', {
            auth: {
                token: token
            }
        });
        const socket = socketRef.current;

        socket.on('connect', () => {
            console.log('Socket connected successfully!', socket.id);
        });

        // --- This is the critical listener for the single-device feature ---
        // It listens for the 'force_logout' event from the server.
        socket.on('force_logout', (data) => {
            console.log('Force logout event received from server:', data.msg);
            alert(data.msg); // Show the message to the user
            
            // This calls the onLogout function passed from App.js,
            // which will clear localStorage and reset the view to the login screen.
            onLogout(); 
        });

        // Cleanup on component unmount
        return () => {
            console.log('Disconnecting socket...');
            socket.disconnect();
        };
    }, [token, onLogout]); // Re-run effect if token or onLogout changes

    return (
        <div className="p-8">
            <h1 className="text-3xl font-bold text-cyan-400">Chat Room</h1>
            <p className="text-gray-400 mt-2">Welcome, {currentUser.username}!</p>
            <p className="mt-4">You are now connected. If you log in from another device, this session will be terminated.</p>
            <button 
                onClick={onLogout} 
                className="mt-6 px-4 py-2 font-bold text-white bg-red-600 rounded-md hover:bg-red-500 transition-colors"
            >
                Logout
            </button>
        </div>
    );
};

export default ChatApp;
