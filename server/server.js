// server/server.js
const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const cors = require('cors');
const { Pool } = require('pg');
const jwt = require('jsonwebtoken');
require('dotenv').config(); // Loads environment variables from a .env file

const authRoutes = require('./routes/auth');
const customerRoutes = require('./routes/customers');
// const messageRoutes = require('./routes/messages'); // You can uncomment this if you use it
const serviceRoutes = require('./routes/services'); // <-- ADD THIS LINE
const userRoutes = require('./routes/users'); // <-- ADD THIS LINE
const statisticsRoutes = require('./routes/statistics'); // <-- ADD THIS LINE
const activitiesRoutes = require('./routes/activities'); // <-- ADD THIS LINE
const repairJobRoutes = require('./routes/repairJobs'); // <-- ADD THIS LINE

const app = express();
const server = http.createServer(app);

// --- Database Setup ---
// Establishes a connection pool to your PostgreSQL database using the URL from your .env file.
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

// --- Socket.IO Setup ---
const io = new Server(server, {
  cors: {
    origin: "*", // Allows connections from any origin, useful for local development.
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 5000;

app.use(cors()); 
app.use(express.json()); 

// This object will store the mapping of: { userId -> socketId }
// This is used to find a user's active connection.
const userSocketMap = {};

// --- Custom Middleware ---
// This middleware makes the database pool, the io instance, and the user socket map
// available to all of your API route files via the 'req' object.
app.use((req, res, next) => {
  req.db = pool;
  req.io = io;
  req.userSocketMap = userSocketMap;
  next();
});

// --- API Routes ---
app.use('/api/auth', authRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/services', serviceRoutes); // <-- ADD THIS LINE
app.use('/api/users', userRoutes); // <-- ADD THIS LINE
app.use('/api/statistics', statisticsRoutes); // <-- ADD THIS LINE
app.use('/api/activities', activitiesRoutes); // <-- ADD THIS LINE
app.use('/api/repair-jobs', repairJobRoutes); // <-- ADD THIS LINE

// --- Socket.IO Connection Handling ---
io.on('connection', (socket) => {
    console.log(`A user connected: ${socket.id}`);
    
    // Authenticate the socket connection using the JWT token sent by the client.
    const token = socket.handshake.auth.token;
    if (token) {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const userId = decoded.user.id;
            
            // Store the new socket ID for this user.
            userSocketMap[userId] = socket.id;
            console.log(`User ${userId} is now associated with socket ${socket.id}`);
        } catch (error) {
            console.error('Socket authentication failed:', error.message);
            socket.disconnect(); // Disconnect if the token is invalid.
        }
    }

    socket.on('disconnect', () => {
        console.log(`User disconnected: ${socket.id}`);
        // When a user disconnects, find their ID in the map and remove them.
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
