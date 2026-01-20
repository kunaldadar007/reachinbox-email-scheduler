/**
 * Email Queue Configuration
 * 
 * Sets up BullMQ queue for delayed email sending.
 * Uses Redis as the backing store, ensuring jobs persist across server restarts.
 */

import { Queue, QueueOptions } from 'bullmq';
import { getRedisClient } from '../config/redis';

// Queue configuration
const queueOptions: QueueOptions = {
  connection: getRedisClient(),
  defaultJobOptions: {
    // Jobs are removed after completion (keep for 24 hours)
    removeOnComplete: {
      age: 24 * 3600, // 24 hours
      count: 1000, // Keep last 1000 jobs
    },
    // Failed jobs are kept for 7 days
    removeOnFail: {
      age: 7 * 24 * 3600, // 7 days
    },
    // Retry failed jobs up to 3 times
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000, // Start with 2 seconds
    },
  },
};

// Create email queue instance
export const emailQueue = new Queue('email-queue', queueOptions);

/**
 * Add email job to queue with delay
 * 
 * @param emailData Email data (recipient, subject, body)
 * @param delayMs Delay in milliseconds before processing
 * @returns Job ID
 */
export async function addEmailJob(
  emailData: {
    recipientEmail: string;
    subject: string;
    body: string;
    scheduledTime: Date;
    jobId: string;
    senderEmail?: string;
  },
  delayMs: number
): Promise<string> {
  const job = await emailQueue.add(
    'send-email',
    emailData,
    {
      delay: delayMs, // Delay before processing
      jobId: emailData.jobId, // Use our custom job ID
    }
  );

  return job.id!;
}

/**
 * Get queue statistics
 */
export async function getQueueStats() {
  const [waiting, active, completed, failed] = await Promise.all([
    emailQueue.getWaitingCount(),
    emailQueue.getActiveCount(),
    emailQueue.getCompletedCount(),
    emailQueue.getFailedCount(),
  ]);

  return {
    waiting,
    active,
    completed,
    failed,
  };
}
