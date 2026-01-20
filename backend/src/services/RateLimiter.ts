/**
 * Rate Limiter Service
 * 
 * Implements rate limiting per sender to prevent overwhelming email service providers.
 * Uses Redis to track sent emails per hour per sender.
 * 
 * Note: BullMQ also has built-in rate limiting, but we use this for additional control.
 */

import { getRedisClient } from '../config/redis';

const HOURLY_LIMIT = parseInt(process.env.HOURLY_EMAIL_LIMIT || '100');

/**
 * Check if sender can send more emails in the current hour
 * 
 * @param senderEmail Sender email address (or 'default' for single sender)
 * @returns true if under limit, false if limit exceeded
 */
export async function canSendEmail(senderEmail: string = 'default'): Promise<boolean> {
  const redis = getRedisClient();
  const key = `rate_limit:${senderEmail}:${getCurrentHour()}`;

  try {
    const count = await redis.get(key);
    const currentCount = count ? parseInt(count) : 0;

    return currentCount < HOURLY_LIMIT;
  } catch (error) {
    console.error('Rate limiter error:', error);
    // On error, allow sending (fail open)
    return true;
  }
}

/**
 * Increment sent email count for sender in current hour
 * 
 * @param senderEmail Sender email address
 */
export async function incrementSentCount(senderEmail: string = 'default'): Promise<void> {
  const redis = getRedisClient();
  const key = `rate_limit:${senderEmail}:${getCurrentHour()}`;

  try {
    const count = await redis.incr(key);
    
    // Set expiration to end of current hour (TTL in seconds)
    if (count === 1) {
      const secondsUntilNextHour = getSecondsUntilNextHour();
      await redis.expire(key, secondsUntilNextHour);
    }
  } catch (error) {
    console.error('Rate limiter increment error:', error);
  }
}

/**
 * Get current hour timestamp (YYYY-MM-DD-HH format)
 */
function getCurrentHour(): string {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, '0');
  const day = String(now.getUTCDate()).padStart(2, '0');
  const hour = String(now.getUTCHours()).padStart(2, '0');
  return `${year}-${month}-${day}-${hour}`;
}

/**
 * Get seconds until next hour starts
 */
function getSecondsUntilNextHour(): number {
  const now = new Date();
  const nextHour = new Date(now);
  nextHour.setUTCHours(now.getUTCHours() + 1, 0, 0, 0);
  return Math.floor((nextHour.getTime() - now.getTime()) / 1000);
}

/**
 * Get current rate limit count for sender
 */
export async function getCurrentCount(senderEmail: string = 'default'): Promise<number> {
  const redis = getRedisClient();
  const key = `rate_limit:${senderEmail}:${getCurrentHour()}`;
  const count = await redis.get(key);
  return count ? parseInt(count) : 0;
}
