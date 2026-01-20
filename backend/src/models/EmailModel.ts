/**
 * Email Model
 * 
 * Database operations for scheduled and sent emails.
 * Provides methods to create, update, and query email records.
 */

import { query } from '../config/database';

export interface ScheduledEmail {
  id?: number;
  job_id: string;
  recipient_email: string;
  subject: string;
  body: string;
  scheduled_time: Date;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  sender_email?: string;
  error_message?: string;
  created_at?: Date;
  updated_at?: Date;
}

export interface SentEmail {
  id?: number;
  job_id: string;
  recipient_email: string;
  subject: string;
  body: string;
  scheduled_time: Date;
  sent_at: Date;
  sender_email?: string;
  ethereal_message_id?: string;
  created_at?: Date;
}

/**
 * Create a scheduled email record
 */
export async function createScheduledEmail(email: ScheduledEmail): Promise<void> {
  const sql = `
    INSERT INTO scheduled_emails 
    (job_id, recipient_email, subject, body, scheduled_time, status, sender_email)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;
  await query(sql, [
    email.job_id,
    email.recipient_email,
    email.subject,
    email.body,
    email.scheduled_time,
    email.status || 'pending',
    email.sender_email || null,
  ]);
}

/**
 * Update scheduled email status
 */
export async function updateScheduledEmailStatus(
  jobId: string,
  status: ScheduledEmail['status'],
  errorMessage?: string
): Promise<void> {
  const sql = `
    UPDATE scheduled_emails 
    SET status = ?, error_message = ?, updated_at = CURRENT_TIMESTAMP
    WHERE job_id = ?
  `;
  await query(sql, [status, errorMessage || null, jobId]);
}

/**
 * Get scheduled emails with pagination
 */
export async function getScheduledEmails(
  page: number = 1,
  limit: number = 20
): Promise<ScheduledEmail[]> {
  const offset = (page - 1) * limit;
  const sql = `
    SELECT * FROM scheduled_emails
    WHERE status IN ('pending', 'processing')
    ORDER BY scheduled_time ASC
    LIMIT ? OFFSET ?
  `;
  const results = await query(sql, [limit, offset]);
  return Array.isArray(results) ? results : results[0] || [];
}

/**
 * Create a sent email record (move from scheduled to sent)
 */
export async function createSentEmail(email: SentEmail): Promise<void> {
  const sql = `
    INSERT INTO sent_emails 
    (job_id, recipient_email, subject, body, scheduled_time, sent_at, sender_email, ethereal_message_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `;
  await query(sql, [
    email.job_id,
    email.recipient_email,
    email.subject,
    email.body,
    email.scheduled_time,
    email.sent_at,
    email.sender_email || null,
    email.ethereal_message_id || null,
  ]);
}

/**
 * Get sent emails with pagination
 */
export async function getSentEmails(
  page: number = 1,
  limit: number = 20
): Promise<SentEmail[]> {
  const offset = (page - 1) * limit;
  const sql = `
    SELECT * FROM sent_emails
    ORDER BY sent_at DESC
    LIMIT ? OFFSET ?
  `;
  const results = await query(sql, [limit, offset]);
  return Array.isArray(results) ? results : results[0] || [];
}

/**
 * Get scheduled email by job ID
 */
export async function getScheduledEmailByJobId(jobId: string): Promise<ScheduledEmail | null> {
  const sql = `SELECT * FROM scheduled_emails WHERE job_id = ? LIMIT 1`;
  const results = await query(sql, [jobId]);
  const rows = Array.isArray(results) ? results : results[0] || [];
  return rows.length > 0 ? rows[0] : null;
}
