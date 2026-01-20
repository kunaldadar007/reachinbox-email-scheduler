/// <reference types="vite/client" />

/**
 * API Service
 *
 * Centralized API client for backend communication.
 * Stable version without Vite proxy issues.
 * Backend runs on port 5001.
 */

// Use backend URL from environment or default to localhost:5000
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';


/* ===================== TYPES ===================== */

export interface ScheduleEmailRequest {
  subject: string;
  body: string;
  recipients: string[];
  startTime: string;
  delayBetweenEmails: number;
  hourlyLimit?: number;
}

export interface ScheduleEmailCSVRequest {
  subject: string;
  body: string;
  csvData: string;
  startTime: string;
  delayBetweenEmails: number;
  hourlyLimit?: number;
}

export interface ScheduledEmail {
  id: number;
  job_id: string;
  recipient_email: string;
  subject: string;
  body: string;
  scheduled_time: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  sender_email?: string;
  error_message?: string;
  created_at: string;
  updated_at: string;
}

export interface SentEmail {
  id: number;
  job_id: string;
  recipient_email: string;
  subject: string;
  body: string;
  scheduled_time: string;
  sent_at: string;
  sender_email?: string;
  ethereal_message_id?: string;
  created_at: string;
}

/* ===================== HELPERS ===================== */

// 🔥 FIX: Backend returns array-of-arrays sometimes
const normalizeArray = <T>(data: any): T[] => {
  if (!Array.isArray(data)) return [];
  return data.flat();
};

/* ===================== API CALLS ===================== */

/**
 * Schedule emails
 */
export async function scheduleEmail(data: ScheduleEmailRequest) {
  const response = await fetch(`${API_URL}/api/schedule-email`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(err || 'Failed to schedule emails');
  }

  return response.json();
}

/**
 * Schedule emails from CSV
 */
export async function scheduleEmailFromCSV(data: ScheduleEmailCSVRequest) {
  const response = await fetch(`${API_URL}/api/schedule-email-csv`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(err || 'Failed to schedule emails from CSV');
  }

  return response.json();
}

/**
 * Get scheduled emails
 */
export async function getScheduledEmails(page = 1, limit = 20) {
  const response = await fetch(
    `${API_URL}/api/scheduled-emails?page=${page}&limit=${limit}`
  );

  if (!response.ok) {
    throw new Error('Failed to fetch scheduled emails');
  }

  const result = await response.json();

  return {
    ...result,
    data: normalizeArray<ScheduledEmail>(result.data),
  };
}

/**
 * Get sent emails
 */
export async function getSentEmails(page = 1, limit = 20) {
  const response = await fetch(
    `${API_URL}/api/sent-emails?page=${page}&limit=${limit}`
  );

  if (!response.ok) {
    throw new Error('Failed to fetch sent emails');
  }

  const result = await response.json();

  return {
    ...result,
    data: normalizeArray<SentEmail>(result.data),
  };
}
