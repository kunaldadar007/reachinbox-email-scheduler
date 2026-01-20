# ReachInbox – Full-stack Email Job Scheduler

A comprehensive email scheduling system built with TypeScript, Express.js, BullMQ, Redis, MySQL/PostgreSQL, React.js, and Tailwind CSS. This application allows users to schedule bulk emails with rate limiting, concurrency control, and persistent job management.

## 🏗️ Architecture Overview

### Backend Architecture

**Queue System (BullMQ + Redis)**
- Uses BullMQ for delayed job processing (no cron jobs)
- Redis acts as both the queue store and cache
- Jobs are persisted in Redis, ensuring they survive server restarts
- Each email recipient becomes a separate delayed job with calculated delay

**Rate Limiting Strategy**
- Configurable hourly limit per sender (default: 100 emails/hour)
- Rate limiting is enforced at the queue level using BullMQ's rate limiter
- Prevents overwhelming email service providers
- Tracks sent emails per hour per sender in Redis

**Concurrency Control**
- BullMQ processes multiple jobs in parallel (configurable concurrency)
- Safe concurrent email sending without race conditions
- Each job is atomic and independent

**Persistence Layer**
- MySQL/PostgreSQL stores all scheduled and sent email records
- Job status tracked: `pending`, `processing`, `completed`, `failed`
- Email metadata (subject, body, recipient, scheduled time) persisted
- Enables querying scheduled and sent emails via REST API

**Email Service (Ethereal Email)**
- Uses Ethereal Email for testing (fake SMTP server)
- Generates test credentials on startup
- All emails are captured in Ethereal's web interface for verification
- Production-ready: can swap to real SMTP (SendGrid, AWS SES, etc.)

### Frontend Architecture

**Authentication**
- Google OAuth 2.0 integration
- Stores user session in localStorage
- Displays user name, email, and avatar

**State Management**
- React hooks for local state management
- API calls via fetch with proper error handling
- Loading states and empty states for better UX

**Component Structure**
- Dashboard with tabbed interface (Scheduled / Sent)
- Compose Email modal with CSV upload
- Data tables with pagination-ready structure
- Responsive design with Tailwind CSS

## 📁 Project Structure

```
reachinbox/
├── backend/
│   ├── src/
│   │   ├── config/          # Configuration files
│   │   ├── database/        # DB connection and migrations
│   │   ├── models/          # Database models
│   │   ├── queues/          # BullMQ queue setup
│   │   ├── workers/         # Email processing workers
│   │   ├── services/        # Business logic (email, rate limiting)
│   │   ├── routes/          # Express API routes
│   │   ├── middleware/      # Express middleware
│   │   └── server.ts        # Express server entry point
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── pages/           # Page components
│   │   ├── services/        # API service functions
│   │   ├── hooks/           # Custom React hooks
│   │   └── App.tsx          # Main app component
│   ├── package.json
│   └── tsconfig.json
└── README.md
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm
- Redis server (running on localhost:6379)
- MySQL 8+ or PostgreSQL 14+ database
- Google OAuth credentials (for frontend authentication)

### Installation

1. **Clone and install dependencies:**
   ```bash
   cd reachinbox
   npm run install:all
   ```

2. **Set up Backend Environment:**
   ```bash
   cd backend
   cp .env.example .env
   ```
   
   Edit `backend/.env` with your database credentials:
   ```env
   DB_HOST=localhost
   DB_PORT=3306
   DB_USER=root
   DB_PASSWORD=yourpassword
   DB_NAME=reachinbox
   REDIS_HOST=localhost
   REDIS_PORT=6379
   PORT=5000
   HOURLY_EMAIL_LIMIT=100
   QUEUE_CONCURRENCY=5
   ```

3. **Set up Frontend Environment:**
   ```bash
   cd frontend
   cp .env.example .env
   ```
   
   Edit `frontend/.env` with your Google OAuth credentials:
   ```env
   VITE_API_URL=http://localhost:5000
   VITE_GOOGLE_CLIENT_ID=your-google-client-id
   ```

4. **Initialize Database:**
   ```bash
   cd backend
   npm run migrate
   ```

5. **Start Redis:**
   ```bash
   # Windows (if installed via Chocolatey)
   redis-server
   
   # Or use Docker
   docker run -d -p 6379:6379 redis:alpine
   ```

### Running the Application

**Option 1: Run both together (recommended for development)**
```bash
npm run dev
```

**Option 2: Run separately**
```bash
# Terminal 1 - Backend
npm run dev:backend

# Terminal 2 - Frontend
npm run dev:frontend
```

- Backend API: http://localhost:5000
- Frontend App: http://localhost:5173

## 📚 API Endpoints

### `POST /api/schedule-email`
Schedule bulk emails for sending.

**Request Body:**
```json
{
  "subject": "Welcome to ReachInbox",
  "body": "Hello {{name}}, welcome!",
  "recipients": ["user1@example.com", "user2@example.com"],
  "startTime": "2024-01-20T10:00:00Z",
  "delayBetweenEmails": 5000,
  "hourlyLimit": 100
}
```

**Response:**
```json
{
  "success": true,
  "jobId": "job-123",
  "scheduledCount": 2
}
```

### `GET /api/scheduled-emails`
Fetch all scheduled (pending) emails.

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)

### `GET /api/sent-emails`
Fetch all sent (completed) emails.

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)

## 🔧 Configuration

### Rate Limiting
- Default: 100 emails per hour per sender
- Configured via `HOURLY_EMAIL_LIMIT` environment variable
- Enforced at the BullMQ queue level

### Concurrency
- Default: 5 concurrent email sends
- Configured via `QUEUE_CONCURRENCY` environment variable
- Adjust based on your email service provider limits

### Email Service
- Currently uses Ethereal Email (testing)
- Credentials auto-generated on first run
- Check console output for Ethereal login credentials
- For production, replace `EmailService` with real SMTP (SendGrid, AWS SES, etc.)

## 🧪 Testing

For demo purposes, keep email batches small (5-10 emails) to avoid long waits. The system supports larger batches but Ethereal Email may have rate limits.

## 📝 Assumptions & Trade-offs

### Assumptions
1. **Single sender**: All emails sent from one sender account (Ethereal)
2. **CSV format**: Simple CSV with email addresses (one per line or comma-separated)
3. **Time zones**: All times in UTC (can be extended to support timezones)
4. **Email body**: Plain text (HTML support can be added)

### Trade-offs
1. **Redis persistence**: Jobs stored in Redis (can be lost if Redis crashes without persistence enabled)
   - **Mitigation**: Database also stores job records as backup
2. **Rate limiting**: Per-sender hourly limit (not per-recipient)
   - **Reason**: Prevents overwhelming email service providers
3. **No retry logic**: Failed emails are marked as failed but not auto-retried
   - **Future enhancement**: Add exponential backoff retry mechanism

## 🛠️ Technologies Used

- **Backend**: Express.js, TypeScript, BullMQ, Redis, MySQL/PostgreSQL, Ethereal Email
- **Frontend**: React.js, TypeScript, Tailwind CSS, Google OAuth
- **Queue**: BullMQ (Redis-backed)
- **Database**: MySQL/PostgreSQL (your choice)

## 📄 License

This project is created for educational/internship purposes.
