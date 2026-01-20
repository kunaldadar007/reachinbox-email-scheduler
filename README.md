# ReachInbox - Email Job Scheduler

A full-stack email scheduling system with TypeScript, Express, BullMQ, Redis, MySQL, React, and Vite.

## Quick Start

### Prerequisites
- Node.js 18+
- MySQL 8+ or PostgreSQL 14+
- Redis 6.2+

### Local Development

1. Clone and install dependencies:
```bash
npm install
```

2. Configure environment variables:
```bash
# Backend
cp backend/.env.example backend/.env
# Edit backend/.env with your database and Redis credentials

# Frontend
cp frontend/.env.example frontend/.env
# Edit frontend/.env with your API URL and Google OAuth credentials
```

3. Start development servers:
```bash
npm run dev
```

Frontend runs at http://localhost:5173  
Backend API runs at http://localhost:5000

### Production Deployment

Deploy on Render.com:

1. Push code to GitHub
2. Create Backend Web Service (Node 18)
   - Build: `npm run build`
   - Start: `npm start`
3. Create Frontend Static Site
   - Build: `cd frontend && npm run build`
   - Publish: `frontend/dist`
4. Set environment variables for each service
5. Deploy database and Redis services

See deployment documentation in backend and frontend README files.

## Project Structure

```
reachinbox/
├── backend/
│   ├── src/
│   │   ├── config/          Configuration files
│   │   ├── database/        Database setup
│   │   ├── models/          Database models
│   │   ├── queues/          BullMQ queues
│   │   ├── workers/         Job processors
│   │   ├── services/        Business logic
│   │   ├── routes/          API endpoints
│   │   ├── middleware/      Express middleware
│   │   └── server.ts        Entry point
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   │   ├── components/      React components
│   │   ├── pages/           Pages
│   │   ├── services/        API client
│   │   ├── hooks/           Custom hooks
│   │   └── App.tsx          Main app
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
