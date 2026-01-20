/**
 * Email Service
 * 
 * Handles email sending using Ethereal Email (fake SMTP for testing).
 * In production, this can be swapped with real SMTP providers like SendGrid, AWS SES, etc.
 */

import nodemailer from 'nodemailer';
import { Transporter } from 'nodemailer';

let transporter: Transporter | null = null;

/**
 * Initialize Ethereal Email transporter
 * Creates a test account and returns credentials
 */
export async function initEmailService(): Promise<void> {
  try {
    // Create Ethereal test account
    const testAccount = await nodemailer.createTestAccount();

    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });

    console.log('✅ Email service initialized (Ethereal Email)');
    console.log('   📧 Visit https://ethereal.email to view test emails');
  } catch (error) {
    console.error('❌ Failed to initialize email service:', error);
    throw error;
  }
}

/**
 * Send an email
 * 
 * @param to Recipient email address
 * @param subject Email subject
 * @param body Email body (plain text)
 * @returns Message ID from Ethereal
 */
export async function sendEmail(
  to: string,
  subject: string,
  body: string
): Promise<string> {
  if (!transporter) {
    throw new Error('Email service not initialized. Call initEmailService() first.');
  }

  try {
    // Send email
    const info = await transporter.sendMail({
      from: '"ReachInbox" <noreply@reachinbox.com>',
      to,
      subject,
      text: body,
    });

    // Get Ethereal message URL
    const messageId = nodemailer.getTestMessageUrl(info) || info.messageId;

    console.log(`📧 Email sent to ${to} - Message ID: ${messageId}`);

    return messageId;
  } catch (error) {
    console.error(`❌ Failed to send email to ${to}:`, error);
    throw error;
  }
}

/**
 * Get email transporter (for testing or advanced usage)
 */
export function getTransporter(): Transporter {
  if (!transporter) {
    throw new Error('Email service not initialized');
  }
  return transporter;
}
