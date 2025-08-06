// server.js
const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const cors = require('cors');
const { Pool } = require('pg');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const messageRoutes = require('./routes/messages');

const app = express();
const server = http.createServer(app);

// --- Database Setup ---
const pool = new Pool({
    connectionString: process.env.DATABASE_URL, // This must be correct in your .env file
});

// --- Socket.IO Setup ---
const io = new Server(server, {
  cors: {
    origin: "*", // Allow all origins for simplicity in local development
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 5000;

app.use(cors()); 
app.use(express.json()); 

// This object will store the mapping of: { userId -> socketId }
const userSocketMap = {};

// Middleware to make the database, io, and map available to our routes
app.use((req, res, next) => {
  req.db = pool;
  req.io = io;
  req.userSocketMap = userSocketMap;
  next();
});

// --- API Routes ---
app.use('/api/auth', authRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/customers', require('./routes/customers')); // <-- ADD THIS LINE

// --- Socket.IO Connection Handling ---
io.on('connection', (socket) => {
    console.log(`A user connected: ${socket.id}`);
    
    // Get the JWT token sent by the client on connection
    const token = socket.handshake.auth.token;
    if (token) {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const userId = decoded.user.id;
            
            // Store the new socket ID for this user, mapping the user's ID to their connection ID
            userSocketMap[userId] = socket.id;
            console.log(`User ${userId} is now associated with socket ${socket.id}`);
        } catch (error) {
            console.error('Socket authentication failed:', error.message);
            socket.disconnect(); // Disconnect if the token is invalid
        }
    }

    socket.on('disconnect', () => {
        console.log(`User disconnected: ${socket.id}`);
        // When a user disconnects, find them in the map and remove them
        for (const userId in userSocketMap) {
            if (userSocketMap[userId] === socket.id) {
                delete userSocketMap[userId];
                console.log(`Removed user ${userId} from the socket map.`);
                break;
            }
        }
    });
});

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
