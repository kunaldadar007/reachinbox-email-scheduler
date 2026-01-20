/**
 * Database Migration Script
 * 
 * Creates necessary tables for email scheduling system.
 * Run this once before starting the application: npm run migrate
 */

import { initDatabase, query, closeDatabase } from '../config/database';
import dotenv from 'dotenv';

dotenv.config();

const dbType = process.env.DB_TYPE || 'mysql';

/**
 * Create tables for MySQL
 */
async function createMySQLTables() {
  // Scheduled emails table
  await query(`
    CREATE TABLE IF NOT EXISTS scheduled_emails (
      id INT AUTO_INCREMENT PRIMARY KEY,
      job_id VARCHAR(255) NOT NULL UNIQUE,
      recipient_email VARCHAR(255) NOT NULL,
      subject VARCHAR(500) NOT NULL,
      body TEXT NOT NULL,
      scheduled_time DATETIME NOT NULL,
      status ENUM('pending', 'processing', 'completed', 'failed') DEFAULT 'pending',
      sender_email VARCHAR(255),
      error_message TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_status (status),
      INDEX idx_scheduled_time (scheduled_time),
      INDEX idx_recipient (recipient_email)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  // Sent emails table (for completed emails)
  await query(`
    CREATE TABLE IF NOT EXISTS sent_emails (
      id INT AUTO_INCREMENT PRIMARY KEY,
      job_id VARCHAR(255) NOT NULL UNIQUE,
      recipient_email VARCHAR(255) NOT NULL,
      subject VARCHAR(500) NOT NULL,
      body TEXT NOT NULL,
      scheduled_time DATETIME NOT NULL,
      sent_at DATETIME NOT NULL,
      sender_email VARCHAR(255),
      ethereal_message_id VARCHAR(255),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_sent_at (sent_at),
      INDEX idx_recipient (recipient_email)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  console.log('✅ MySQL tables created successfully');
}

/**
 * Create tables for PostgreSQL
 */
async function createPostgresTables() {
  // Scheduled emails table
  await query(`
    CREATE TABLE IF NOT EXISTS scheduled_emails (
      id SERIAL PRIMARY KEY,
      job_id VARCHAR(255) NOT NULL UNIQUE,
      recipient_email VARCHAR(255) NOT NULL,
      subject VARCHAR(500) NOT NULL,
      body TEXT NOT NULL,
      scheduled_time TIMESTAMP NOT NULL,
      status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
      sender_email VARCHAR(255),
      error_message TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Create indexes
  await query(`CREATE INDEX IF NOT EXISTS idx_status ON scheduled_emails(status);`);
  await query(`CREATE INDEX IF NOT EXISTS idx_scheduled_time ON scheduled_emails(scheduled_time);`);
  await query(`CREATE INDEX IF NOT EXISTS idx_recipient ON scheduled_emails(recipient_email);`);

  // Sent emails table
  await query(`
    CREATE TABLE IF NOT EXISTS sent_emails (
      id SERIAL PRIMARY KEY,
      job_id VARCHAR(255) NOT NULL UNIQUE,
      recipient_email VARCHAR(255) NOT NULL,
      subject VARCHAR(500) NOT NULL,
      body TEXT NOT NULL,
      scheduled_time TIMESTAMP NOT NULL,
      sent_at TIMESTAMP NOT NULL,
      sender_email VARCHAR(255),
      ethereal_message_id VARCHAR(255),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Create indexes
  await query(`CREATE INDEX IF NOT EXISTS idx_sent_at ON sent_emails(sent_at);`);
  await query(`CREATE INDEX IF NOT EXISTS idx_recipient_sent ON sent_emails(recipient_email);`);

  // Create trigger for updated_at
  await query(`
    CREATE OR REPLACE FUNCTION update_updated_at_column()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.updated_at = CURRENT_TIMESTAMP;
      RETURN NEW;
    END;
    $$ language 'plpgsql';
  `);

  await query(`
    DROP TRIGGER IF EXISTS update_scheduled_emails_updated_at ON scheduled_emails;
    CREATE TRIGGER update_scheduled_emails_updated_at
    BEFORE UPDATE ON scheduled_emails
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
  `);

  console.log('✅ PostgreSQL tables created successfully');
}

/**
 * Run migrations
 */
async function migrate() {
  try {
    console.log('🔄 Starting database migration...');
    await initDatabase();

    if (dbType === 'postgres') {
      await createPostgresTables();
    } else {
      await createMySQLTables();
    }

    console.log('✅ Migration completed successfully');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await closeDatabase();
  }
}

// Run migration if this file is executed directly
if (require.main === module) {
  migrate();
}
