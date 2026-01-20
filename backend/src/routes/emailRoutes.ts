/**
 * Email API Routes
 * 
 * REST API endpoints for scheduling and querying emails.
 * Handles request validation, CSV parsing, and job creation.
 */

import express, { Request, Response } from 'express';
import { z } from 'zod';
import { parse } from 'csv-parse/sync';
import { addEmailJob } from '../queues/emailQueue';
import { createScheduledEmail } from '../models/EmailModel';
import { getScheduledEmails, getSentEmails } from '../models/EmailModel';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// Validation schema for schedule email request
const scheduleEmailSchema = z.object({
  subject: z.string().min(1, 'Subject is required'),
  body: z.string().min(1, 'Body is required'),
  recipients: z.array(z.string().email()).min(1, 'At least one recipient is required'),
  startTime: z.string().datetime(),
  delayBetweenEmails: z.number().int().min(0).default(5000),
  hourlyLimit: z.number().int().min(1).optional(),
});

/**
 * POST /api/schedule-email
 * Schedule bulk emails for sending
 */
router.post('/schedule-email', async (req: Request, res: Response) => {
  try {
    console.log('[API] /schedule-email request received:', {
      subject: req.body.subject?.substring(0, 50),
      recipientCount: req.body.recipients?.length,
      startTime: req.body.startTime,
    });

    // Validate request body
    const validatedData = scheduleEmailSchema.parse(req.body);
    const {
      subject,
      body,
      recipients,
      startTime,
      delayBetweenEmails,
      hourlyLimit,
    } = validatedData;

    const startDate = new Date(startTime);
    const now = new Date();

    // Validate start time is in the future
    if (startDate <= now) {
      console.warn('[API] Invalid start time (past):', startTime);
      return res.status(400).json({
        success: false,
        error: 'Start time must be in the future',
      });
    }

    // Calculate initial delay
    const initialDelay = startDate.getTime() - now.getTime();

    // Create jobs for each recipient
    const jobIds: string[] = [];
    let delayOffset = 0;

    console.log('[API] Creating jobs for', recipients.length, 'recipients');

    for (const recipient of recipients) {
      const jobId = `email-${uuidv4()}`;
      const scheduledTime = new Date(startDate.getTime() + delayOffset);

      // Create scheduled email record in database
      await createScheduledEmail({
        job_id: jobId,
        recipient_email: recipient,
        subject,
        body,
        scheduled_time: scheduledTime,
        status: 'pending',
      });

      // Add job to queue with calculated delay
      const totalDelay = initialDelay + delayOffset;
      await addEmailJob(
        {
          recipientEmail: recipient,
          subject,
          body,
          scheduledTime,
          jobId,
        },
        totalDelay
      );

      jobIds.push(jobId);
      delayOffset += delayBetweenEmails;
    }

    const batchId = `batch-${uuidv4()}`;
    console.log('[API] Successfully scheduled batch:', {
      batchId,
      scheduledCount: recipients.length,
      jobIds: jobIds.slice(0, 3), // Log first 3 job IDs
    });

    res.status(201).json({
      success: true,
      jobId: batchId,
      scheduledCount: recipients.length,
      message: `Scheduled ${recipients.length} emails`,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      console.error('[API] Validation error:', error.errors);
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors,
      });
    }

    console.error('[API] Error scheduling emails:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to schedule emails',
      message: error.message,
    });
  }
});

/**
 * POST /api/schedule-email-csv
 * Schedule emails from CSV file upload
 */
router.post('/schedule-email-csv', async (req: Request, res: Response) => {
  try {
    console.log('[API] /schedule-email-csv request received');

    // Check if CSV file is uploaded
    if (!req.body.csvData) {
      console.warn('[API] Missing CSV data');
      return res.status(400).json({
        success: false,
        error: 'CSV data is required',
      });
    }

    // Parse CSV
    const records = parse(req.body.csvData, {
      columns: false,
      skip_empty_lines: true,
      trim: true,
    });

    // Extract email addresses (assuming first column or entire row)
    const recipients: string[] = [];
    for (const record of records) {
      // Handle both comma-separated and line-separated formats
      const emails = Array.isArray(record) ? record : [record];
      for (const email of emails) {
        const trimmed = String(email).trim();
        if (trimmed && trimmed.includes('@')) {
          recipients.push(trimmed);
        }
      }
    }

    if (recipients.length === 0) {
      console.warn('[API] No valid emails found in CSV');
      return res.status(400).json({
        success: false,
        error: 'No valid email addresses found in CSV',
      });
    }

    console.log('[API] Extracted', recipients.length, 'emails from CSV');

    // Validate other fields
    const { subject, body, startTime, delayBetweenEmails } = req.body;

    if (!subject || !body || !startTime) {
      console.warn('[API] Missing required fields');
      return res.status(400).json({
        success: false,
        error: 'Subject, body, and startTime are required',
      });
    }

    // Use the same scheduling logic
    const validatedData = scheduleEmailSchema.parse({
      subject,
      body,
      recipients,
      startTime,
      delayBetweenEmails: delayBetweenEmails || 5000,
    });

    const startDate = new Date(validatedData.startTime);
    const now = new Date();

    if (startDate <= now) {
      console.warn('[API] Invalid start time (past):', startTime);
      return res.status(400).json({
        success: false,
        error: 'Start time must be in the future',
      });
    }

    const initialDelay = startDate.getTime() - now.getTime();
    const jobIds: string[] = [];
    let delayOffset = 0;

    console.log('[API] Creating jobs for', validatedData.recipients.length, 'recipients from CSV');

    for (const recipient of validatedData.recipients) {
      const jobId = `email-${uuidv4()}`;
      const scheduledTime = new Date(startDate.getTime() + delayOffset);

      await createScheduledEmail({
        job_id: jobId,
        recipient_email: recipient,
        subject: validatedData.subject,
        body: validatedData.body,
        scheduled_time: scheduledTime,
        status: 'pending',
      });

      const totalDelay = initialDelay + delayOffset;
      await addEmailJob(
        {
          recipientEmail: recipient,
          subject: validatedData.subject,
          body: validatedData.body,
          scheduledTime,
          jobId,
        },
        totalDelay
      );

      jobIds.push(jobId);
      delayOffset += validatedData.delayBetweenEmails;
    }

    const batchId = `batch-${uuidv4()}`;
    console.log('[API] Successfully scheduled batch from CSV:', {
      batchId,
      scheduledCount: validatedData.recipients.length,
      jobIds: jobIds.slice(0, 3), // Log first 3 job IDs
    });

    res.status(201).json({
      success: true,
      jobId: batchId,
      scheduledCount: validatedData.recipients.length,
      message: `Scheduled ${validatedData.recipients.length} emails from CSV`,
    });
  } catch (error: any) {
    console.error('[API] Error scheduling emails from CSV:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to schedule emails from CSV',
      message: error.message,
    });
  }
});

/**
 * GET /api/scheduled-emails
 * Get all scheduled (pending) emails
 */
router.get('/scheduled-emails', async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    console.log('[API] /scheduled-emails request:', { page, limit });

    const emails = await getScheduledEmails(page, limit);

    console.log('[API] Returning', emails.length, 'scheduled emails');

    res.json({
      success: true,
      data: emails,
      page,
      limit,
    });
  } catch (error: any) {
    console.error('[API] Error fetching scheduled emails:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch scheduled emails',
      message: error.message,
    });
  }
});

/**
 * GET /api/sent-emails
 * Get all sent (completed) emails
 */
router.get('/sent-emails', async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    console.log('[API] /sent-emails request:', { page, limit });

    const emails = await getSentEmails(page, limit);

    console.log('[API] Returning', emails.length, 'sent emails');

    res.json({
      success: true,
      data: emails,
      page,
      limit,
    });
  } catch (error: any) {
    console.error('[API] Error fetching sent emails:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch sent emails',
      message: error.message,
    });
  }
});

export default router;
