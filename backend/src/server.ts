/**
 * Express Server Entry Point
 *
 * Initializes Express server, connects to database and Redis,
 * sets up routes, and starts the email worker.
 * This is the main entry point for the backend application.
 */

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initDatabase, closeDatabase } from './config/database';
import { initRedis, closeRedis } from './config/redis';
import { initEmailService } from './services/EmailService';
import emailRoutes from './routes/emailRoutes';
import { errorHandler } from './middleware/errorHandler';
import './workers/emailWorker'; // Start the worker

// Load environment variables
dotenv.config();

const app = express();
const PORT = parseInt(process.env.PORT || '5000') || 5000; // ✅ keep backend on 5000 for stable connection

// ✅ CORS configuration
const ALLOWED_ORIGINS = [
  'http://localhost:5173', // local dev
  'http://localhost:3000',
  process.env.FRONTEND_URL || '', // production frontend
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || ALLOWED_ORIGINS.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Root endpoint
app.get('/', (req, res) => {
  res.json({ message: 'API is running' });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes
app.use('/api', emailRoutes);

// Error handler
app.use(errorHandler);

/**
 * Initialize all services and start server
 */
async function startServer() {
  try {
    console.log('🚀 Starting ReachInbox backend server...');
    console.log('Environment:', {
      NODE_ENV: process.env.NODE_ENV,
      DATABASE_URL: process.env.DATABASE_URL ? 'SET' : 'NOT SET',
      REDIS_URL: process.env.REDIS_URL ? 'SET' : 'NOT SET',
      DB_TYPE: process.env.DB_TYPE,
      PORT: PORT,
    });

    // Initialize database
    try {
      await initDatabase();
      console.log('✅ Database initialized');
    } catch (dbError) {
      console.error('⚠️ Database initialization failed:', dbError);
      // Don't exit - allow server to start and handle requests without DB
    }

    // Initialize Redis
    try {
      initRedis();
      console.log('✅ Redis connection initiated');
    } catch (redisError) {
      console.error('⚠️ Redis initialization error:', redisError);
      // Don't exit - allow server to start without Redis
    }

    // Initialize email service
    try {
      await initEmailService();
      console.log('✅ Email service initialized');
    } catch (emailError) {
      console.error('⚠️ Email service initialization failed:', emailError);
      // Don't exit - allow server to start
    }

    // Start Express server
    app.listen(PORT, () => {
      console.log(`✅ Server running on http://localhost:${PORT}`);
      console.log(`📧 Email worker is running and ready to process jobs`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully...');
  await closeDatabase();
  await closeRedis();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully...');
  await closeDatabase();
  await closeRedis();
  process.exit(0);
});

// Start server
startServer();
