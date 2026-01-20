/**
 * Database Configuration
 * 
 * Handles connection to MySQL or PostgreSQL database.
 * Supports both database types based on DB_TYPE environment variable.
 */

import mysql from 'mysql2/promise';
import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

// Database connection pool based on DB_TYPE
let mysqlPool: mysql.Pool | null = null;
let pgPool: Pool | null = null;

const dbType = process.env.DB_TYPE || 'mysql';

/**
 * Initialize MySQL connection pool
 */
async function initMySQL() {
  mysqlPool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'reachinbox',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  });

  // Test connection
  try {
    await mysqlPool.query('SELECT 1');
    console.log('✅ MySQL database connected successfully');
  } catch (error) {
    console.error('❌ MySQL connection failed:', error);
    throw error;
  }
}

/**
 * Initialize PostgreSQL connection pool
 */
async function initPostgres() {
  pgPool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'reachinbox',
    max: 10,
  });

  // Test connection
  try {
    await pgPool.query('SELECT 1');
    console.log('✅ PostgreSQL database connected successfully');
  } catch (error) {
    console.error('❌ PostgreSQL connection failed:', error);
    throw error;
  }
}

/**
 * Initialize database connection based on DB_TYPE
 */
export async function initDatabase() {
  if (dbType === 'postgres') {
    await initPostgres();
  } else {
    await initMySQL();
  }
}

/**
 * Get MySQL connection pool
 */
export function getMySQLPool(): mysql.Pool {
  if (!mysqlPool) {
    throw new Error('MySQL pool not initialized. Call initDatabase() first.');
  }
  return mysqlPool;
}

/**
 * Get PostgreSQL connection pool
 */
export function getPostgresPool(): Pool {
  if (!pgPool) {
    throw new Error('PostgreSQL pool not initialized. Call initDatabase() first.');
  }
  return pgPool;
}

/**
 * Execute a query (works for both MySQL and PostgreSQL)
 */
export async function query(sql: string, params?: any[]): Promise<any> {
  if (dbType === 'postgres') {
    return pgPool!.query(sql, params);
  } else {
    return mysqlPool!.query(sql, params);
  }
}

/**
 * Close database connections
 */
export async function closeDatabase() {
  if (mysqlPool) {
    await mysqlPool.end();
    console.log('MySQL connection closed');
  }
  if (pgPool) {
    await pgPool.end();
    console.log('PostgreSQL connection closed');
  }
}
