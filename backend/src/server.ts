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
const PORT = process.env.PORT || 5000; // ✅ keep backend on 5000 for stable connection

// ✅ CORS configuration (important fix for "Failed to fetch")
app.use(
  cors({
    origin: '*', // allow all for dev (safe on localhost)
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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

    // Initialize database
    await initDatabase();

    // Initialize Redis
    initRedis();

    // Initialize email service
    await initEmailService();

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
