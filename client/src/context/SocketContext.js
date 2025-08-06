import React, { createContext, useContext, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext();

// Custom hook to use the socket context easily in other components
export const useSocket = () => {
    return useContext(SocketContext);
};

// The provider component that will wrap our application
export const SocketProvider = ({ token, children }) => {
    const socketRef = useRef(null);

    useEffect(() => {
        // Only establish a connection if there's a token
        if (token) {
            console.log('[SocketProvider] Connecting with token...');
            socketRef.current = io('http://localhost:5000', {
                auth: { token }
            });

            const socket = socketRef.current;
            socket.on('connect', () => console.log(`[SocketProvider] Connected: ${socket.id}`));
            
            // This is where we can listen for global events like 'force_logout'
            socket.on('force_logout', (data) => {
                console.log(`[SocketProvider] Received 'force_logout': ${data.msg}`);
                // Dispatch a global event that App.js can listen for
                window.dispatchEvent(new Event('force-logout'));
            });

            // Cleanup on dismount or token change
            return () => {
                console.log('[SocketProvider] Disconnecting socket.');
                socket.disconnect();
            };
        }
    }, [token]);

    return (
        <SocketContext.Provider value={socketRef.current}>
            {children}
        </SocketContext.Provider>
    );
};
