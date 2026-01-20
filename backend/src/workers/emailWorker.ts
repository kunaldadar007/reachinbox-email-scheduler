/**
 * Email Worker
 * 
 * Processes email jobs from the BullMQ queue.
 * Handles concurrency, rate limiting, and error handling.
 * This worker runs continuously and processes jobs as they become ready.
 */

import { Worker, WorkerOptions } from 'bullmq';
import { sendEmail } from '../services/EmailService';
import { canSendEmail, incrementSentCount } from '../services/RateLimiter';
import {
  updateScheduledEmailStatus,
  createSentEmail,
  getScheduledEmailByJobId,
} from '../models/EmailModel';

// Worker configuration
const redisPort = parseInt(process.env.REDIS_PORT || '6379') || 6379;

const workerOptions: WorkerOptions = {
  connection: {
    host: process.env.REDIS_HOST || 'localhost',
    port: redisPort,
    password: process.env.REDIS_PASSWORD || undefined,
  },
  concurrency: parseInt(process.env.QUEUE_CONCURRENCY || '5') || 5, // Process 5 emails concurrently
  limiter: {
    // Rate limit: max 100 jobs per hour (additional safety)
    max: parseInt(process.env.HOURLY_EMAIL_LIMIT || '100'),
    duration: 3600000, // 1 hour in milliseconds
  },
};

// Create worker instance
export const emailWorker = new Worker(
  'email-queue',
  async (job) => {
    const {
      recipientEmail,
      subject,
      body,
      scheduledTime,
      jobId,
      senderEmail,
    } = job.data;

    console.log(`🔄 Processing email job ${jobId} for ${recipientEmail}`);

    try {
      // Update status to processing
      await updateScheduledEmailStatus(jobId, 'processing');

      // Check rate limit
      const canSend = await canSendEmail(senderEmail || 'default');
      if (!canSend) {
        throw new Error(
          `Rate limit exceeded for sender. Hourly limit: ${process.env.HOURLY_EMAIL_LIMIT || 100}`
        );
      }

      // Send email
      const messageId = await sendEmail(recipientEmail, subject, body);

      // Increment rate limit counter
      await incrementSentCount(senderEmail || 'default');

      // Update status to completed
      await updateScheduledEmailStatus(jobId, 'completed');

      // Create sent email record
      await createSentEmail({
        job_id: jobId,
        recipient_email: recipientEmail,
        subject,
        body,
        scheduled_time: new Date(scheduledTime),
        sent_at: new Date(),
        sender_email: senderEmail,
        ethereal_message_id: messageId,
      });

      console.log(`✅ Email sent successfully: ${jobId}`);

      return { success: true, messageId };
    } catch (error: any) {
      console.error(`❌ Failed to send email ${jobId}:`, error.message);

      // Update status to failed
      await updateScheduledEmailStatus(jobId, 'failed', error.message);

      // Re-throw to mark job as failed in BullMQ
      throw error;
    }
  },
  workerOptions
);

// Worker event handlers
emailWorker.on('completed', (job) => {
  console.log(`✅ Job ${job.id} completed`);
});

emailWorker.on('failed', (job, err) => {
  console.error(`❌ Job ${job?.id} failed:`, err.message);
});

emailWorker.on('error', (error) => {
  console.error('❌ Worker error:', error);
});

console.log('✅ Email worker started');
