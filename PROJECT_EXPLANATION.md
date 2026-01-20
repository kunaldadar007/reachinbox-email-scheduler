# ReachInbox - Project Explanation

## Overview

ReachInbox is a full-stack email scheduling application that allows users to schedule bulk emails with advanced features like rate limiting, delayed sending, and persistent job management. This project demonstrates modern full-stack development practices using TypeScript, Express.js, BullMQ, Redis, MySQL/PostgreSQL, React.js, and Tailwind CSS.

## Architecture Deep Dive

### 1. Backend Architecture

#### Queue System (BullMQ + Redis)
- **Why BullMQ?** BullMQ provides a robust, Redis-backed job queue system that handles delayed jobs natively without requiring cron jobs. This is more efficient and scalable than traditional cron-based scheduling.
- **How it works:**
  - When a user schedules emails, each recipient becomes a separate job in the queue
  - Each job has a calculated delay based on the start time and delay between emails
  - Jobs are stored in Redis, ensuring they persist across server restarts
  - The worker processes jobs concurrently (configurable, default: 5 at a time)

#### Rate Limiting Strategy
- **Per-sender hourly limit:** Prevents overwhelming email service providers
- **Implementation:** 
  - Redis tracks sent email count per sender per hour
  - Each hour gets a unique key: `rate_limit:{sender}:{YYYY-MM-DD-HH}`
  - Keys expire automatically at the end of each hour
  - BullMQ also has built-in rate limiting as an additional safety layer

#### Concurrency Control
- **Safe parallel processing:** Multiple emails can be sent simultaneously without race conditions
- **Why it's safe:**
  - Each job is independent and atomic
  - Database operations use transactions where needed
  - Rate limiting uses Redis atomic operations (INCR)
  - No shared mutable state between jobs

#### Persistence Layer
- **Dual storage:** Both Redis (for queue) and database (for records)
- **Why both?**
  - Redis: Fast queue operations, job state management
  - Database: Queryable history, backup if Redis fails, reporting
- **Job lifecycle:**
  1. Created in database with status 'pending'
  2. Added to Redis queue with delay
  3. Worker picks up job, updates status to 'processing'
  4. Email sent, status updated to 'completed'
  5. Record moved to `sent_emails` table

#### Email Service (Ethereal Email)
- **Why Ethereal?** Perfect for testing - provides fake SMTP that captures all emails
- **Production ready:** Easy to swap with real SMTP (SendGrid, AWS SES, etc.)
- **Credentials:** Auto-generated on first run, displayed in console

### 2. Frontend Architecture

#### Authentication Flow
- **Google OAuth 2.0:** Industry-standard authentication
- **State management:** React hooks + localStorage for persistence
- **User info:** Name, email, and avatar displayed in header

#### Component Structure
- **Modular design:** Each component has a single responsibility
- **Reusable components:** EmailTable, ComposeModal can be used independently
- **State management:** Local state with React hooks, no external state library needed

#### API Integration
- **Centralized API client:** All backend calls go through `services/api.ts`
- **Error handling:** Consistent error handling with user-friendly messages
- **Loading states:** Visual feedback during async operations

## Key Features Explained

### 1. Email Scheduling
- **Manual entry:** Users can paste comma or line-separated email addresses
- **CSV upload:** Parse CSV files for bulk email lists
- **Delayed sending:** Each email is scheduled with a calculated delay
- **Start time:** All emails start from a specified future time

### 2. Rate Limiting
- **Configurable:** Set via `HOURLY_EMAIL_LIMIT` environment variable
- **Per-sender:** Each sender has their own limit
- **Automatic reset:** Limits reset every hour
- **Queue-level:** BullMQ enforces limits at the queue level

### 3. Job Persistence
- **Survives restarts:** Jobs stored in Redis persist across server restarts
- **Database backup:** All job records also stored in database
- **Status tracking:** Real-time status updates (pending → processing → completed/failed)

### 4. Concurrency
- **Parallel processing:** Multiple emails sent simultaneously
- **Configurable:** Set via `QUEUE_CONCURRENCY` environment variable
- **Safe:** No race conditions due to atomic operations

## Technology Choices & Rationale

### Backend
- **Express.js:** Lightweight, flexible, widely adopted
- **TypeScript:** Type safety, better developer experience
- **BullMQ:** Modern, Redis-backed job queue (better than Bull v3)
- **Redis:** Fast, reliable queue storage
- **MySQL/PostgreSQL:** Reliable, queryable data persistence
- **Ethereal Email:** Perfect for testing, no setup required

### Frontend
- **React.js:** Component-based, widely used, great ecosystem
- **TypeScript:** Type safety, better IDE support
- **Tailwind CSS:** Utility-first, rapid UI development
- **Vite:** Fast build tool, great developer experience
- **Google OAuth:** Industry-standard authentication

## Data Flow

### Scheduling Flow
1. User fills form (subject, body, recipients, start time, delays)
2. Frontend sends POST request to `/api/schedule-email`
3. Backend validates request
4. For each recipient:
   - Create database record (status: 'pending')
   - Calculate delay (start time + offset)
   - Add job to BullMQ queue with delay
5. Return success response with job count

### Sending Flow
1. BullMQ worker picks up job when delay expires
2. Update database status to 'processing'
3. Check rate limit (can send?)
4. Send email via Ethereal
5. Increment rate limit counter
6. Update database status to 'completed'
7. Create record in `sent_emails` table

### Querying Flow
1. User clicks "Scheduled Emails" or "Sent Emails" tab
2. Frontend sends GET request to respective endpoint
3. Backend queries database
4. Returns paginated results
5. Frontend displays in table

## Security Considerations

1. **Input validation:** Zod schemas validate all inputs
2. **SQL injection:** Parameterized queries prevent SQL injection
3. **Rate limiting:** Prevents abuse and DoS
4. **CORS:** Configured for frontend origin only
5. **Error handling:** Sensitive errors not exposed to client

## Scalability Considerations

1. **Horizontal scaling:** Multiple worker instances can process jobs
2. **Database indexing:** Indexes on frequently queried columns
3. **Redis clustering:** Can be scaled horizontally
4. **Connection pooling:** Database connections pooled efficiently
5. **Queue partitioning:** Can partition queues by sender/priority

## Future Enhancements

1. **Retry logic:** Exponential backoff for failed emails
2. **Email templates:** Pre-defined templates with variables
3. **Analytics:** Open rates, click rates, bounce handling
4. **Webhooks:** Notify external systems on email events
5. **Multi-sender:** Support multiple sender accounts
6. **Time zone support:** Schedule emails in user's timezone
7. **HTML emails:** Support rich HTML email content
8. **Attachments:** Support file attachments

## Testing Strategy

For demo purposes:
- Keep email batches small (5-10 emails)
- Use Ethereal Email to verify emails are sent
- Check Ethereal web interface for captured emails
- Monitor console logs for job processing

## Deployment Considerations

1. **Environment variables:** All sensitive config via env vars
2. **Database migrations:** Run migrations before starting server
3. **Redis persistence:** Enable Redis persistence for production
4. **Process management:** Use PM2 or similar for production
5. **Monitoring:** Add logging and monitoring (e.g., Winston, Sentry)

## Demo Video Script

1. **Introduction (30s)**
   - "ReachInbox is a full-stack email scheduling application..."
   - Show login page, explain Google OAuth

2. **Authentication (30s)**
   - Click "Sign in with Google"
   - Show user info in header

3. **Compose Email (2min)**
   - Click "Compose Email"
   - Fill in subject, body
   - Upload CSV or enter emails manually
   - Set start time (near future for demo)
   - Set delay (5000ms = 5 seconds)
   - Submit and show success

4. **Scheduled Emails Tab (1min)**
   - Show scheduled emails table
   - Explain statuses (pending, processing)
   - Show email count

5. **Email Processing (1min)**
   - Wait for emails to process
   - Show status changes in real-time
   - Explain rate limiting and concurrency

6. **Sent Emails Tab (1min)**
   - Switch to "Sent Emails" tab
   - Show completed emails
   - Show Ethereal message IDs
   - Explain persistence

7. **Architecture Overview (1min)**
   - Explain BullMQ queue system
   - Explain rate limiting
   - Explain database persistence
   - Show Redis and database connections

8. **Conclusion (30s)**
   - Summarize key features
   - Mention scalability and production readiness

## Code Quality

- **TypeScript:** Full type safety throughout
- **Comments:** Every file has header comments explaining purpose
- **Error handling:** Comprehensive error handling at all levels
- **Code organization:** Clear folder structure, separation of concerns
- **Best practices:** Follows Express and React best practices

This project demonstrates production-ready code suitable for an internship assignment, with clear architecture, comprehensive features, and excellent documentation.
