import React, { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

const ChatApp = ({ currentUser, token, onLogout, onForceLogout }) => {
    const socketRef = useRef(null);

    useEffect(() => {
        console.log('[ChatApp] useEffect running. Attempting to connect...');
        
        // Establish socket connection with the token for authentication
        socketRef.current = io('http://localhost:5000', {
            auth: { token }
        });
        const socket = socketRef.current;

        // --- Standard Socket.IO Listeners for Debugging ---
        socket.on('connect', () => {
            console.log(`%c[Socket] CONNECTED: ${socket.id}`, 'color: #00ff00;');
        });

        socket.on('disconnect', (reason) => {
            console.log(`%c[Socket] DISCONNECTED: ${reason}`, 'color: #ff0000;');
        });

        socket.on('connect_error', (err) => {
            console.error(`%c[Socket] CONNECTION ERROR: ${err.message}`, 'color: #ff0000;');
            // If the token is invalid (e.g., expired), perform a global logout to clear it.
            onLogout();
        });

        // --- Custom Application Event Listener ---
        // This is the crucial event listener for multi-device logout.
        socket.on('force_logout', (data) => {
            console.log(`%c[Socket] RECEIVED 'force_logout': ${data.msg}`, 'color: #ffa500; font-weight: bold;');
            // When the event is received, call the onForceLogout function passed from App.js.
            // This will trigger the alert modal in App.js.
            onForceLogout(data.msg);
        });

        // Cleanup the socket connection when the component is unmounted
        return () => {
            console.log('[ChatApp] Cleanup. Disconnecting socket.');
            socket.disconnect();
        };
    }, [token, onLogout, onForceLogout]);

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
