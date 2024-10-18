const express = require('express');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const helmet = require('helmet');
const cors = require('cors');
const { createServer } = require('http');
const { Server } = require('socket.io');
const connectDB = require('./dbConn');
const authRoutes = require('./routes/auth');
const taskRoutes = require('./routes/tasks');
const swaggerJsDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const rateLimit = require('express-rate-limit');

// Load env variables
dotenv.config();

// Initialize express app
const app = express();
app.use(express.json());
app.use(helmet());
app.use(cors());

// Rate limiter
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Swagger setup
const swaggerOptions = {
    swaggerDefinition: {
        openapi: '3.0.0',
        info: {
            title: 'Task Manager API',
            version: '1.0.0',
            description: 'A simple Task Management API',
        },
        servers: [
            {
                url: 'http://localhost:5000',
            },
        ],
    },
    apis: ['./routes/*.js'],
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);

// Use routes
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));
app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);

// Setup server for real-time updates
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

app.set('socketio', io);

// Socket.io Event Handling
io.on('connection', (socket) => {
    console.log('New client connected:', socket.id);

    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
    });

    socket.on('taskUpdated', (data) => {
        io.emit('taskUpdated', data);
    });
});

// Graceful shutdown
const shutdown = async () => {
    console.log('Shutting down gracefully...');
    try {
        await mongoose.disconnect();
        httpServer.close(() => {
            console.log('Server closed');
            process.exit(0);
        });
    } catch (error) {
        console.error('Error during shutdown', error);
        process.exit(1);
    }
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

// Start the server
const PORT = process.env.PORT || 5000;

app.listen(PORT, async () => {
    try {
        await connectDB();
        console.log(`Server running on port ${PORT}`);
    } catch (error) {
        console.error('Failed to connect to database:', error.message);
        process.exit(1); // Stop server if DB connection fails
    }
});
