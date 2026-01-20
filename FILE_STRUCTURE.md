# Complete File Structure

```
reachinbox/
├── .gitignore                          # Git ignore rules
├── package.json                        # Root package.json with workspace scripts
├── README.md                           # Main project documentation
├── PROJECT_EXPLANATION.md              # Detailed architecture explanation
├── QUICK_START.md                      # Quick start guide
├── FILE_STRUCTURE.md                   # This file
│
├── backend/                            # Backend Express.js application
│   ├── package.json                    # Backend dependencies
│   ├── tsconfig.json                   # TypeScript configuration
│   ├── .env.example                    # Environment variables template
│   │
│   └── src/
│       ├── server.ts                   # Express server entry point
│       │
│       ├── config/                     # Configuration files
│       │   ├── database.ts            # Database connection (MySQL/PostgreSQL)
│       │   └── redis.ts               # Redis connection for BullMQ
│       │
│       ├── database/                   # Database setup
│       │   └── migrate.ts             # Database migration script
│       │
│       ├── models/                     # Database models
│       │   └── EmailModel.ts          # Email CRUD operations
│       │
│       ├── queues/                     # BullMQ queue setup
│       │   └── emailQueue.ts          # Email queue configuration
│       │
│       ├── workers/                    # BullMQ workers
│       │   └── emailWorker.ts         # Email processing worker
│       │
│       ├── services/                   # Business logic services
│       │   ├── EmailService.ts        # Email sending (Ethereal)
│       │   └── RateLimiter.ts         # Rate limiting logic
│       │
│       ├── routes/                     # Express API routes
│       │   └── emailRoutes.ts         # Email scheduling endpoints
│       │
│       └── middleware/                  # Express middleware
│           └── errorHandler.ts        # Error handling middleware
│
└── frontend/                           # Frontend React application
    ├── package.json                    # Frontend dependencies
    ├── tsconfig.json                   # TypeScript configuration
    ├── tsconfig.node.json              # Node TypeScript config
    ├── vite.config.ts                  # Vite build configuration
    ├── tailwind.config.js              # Tailwind CSS configuration
    ├── postcss.config.js               # PostCSS configuration
    ├── index.html                      # HTML entry point
    ├── .env.example                    # Environment variables template
    │
    └── src/
        ├── main.tsx                    # React app entry point
        ├── App.tsx                     # Main app component
        ├── index.css                   # Global styles (Tailwind)
        │
        ├── components/                 # React components
        │   ├── Header.tsx             # App header with user info
        │   ├── ComposeModal.tsx       # Email composition modal
        │   └── EmailTable.tsx         # Email list table component
        │
        ├── pages/                      # Page components
        │   ├── Login.tsx              # Login page with Google OAuth
        │   └── Dashboard.tsx          # Main dashboard page
        │
        ├── hooks/                      # Custom React hooks
        │   └── useAuth.ts             # Authentication hook
        │
        └── services/                   # API services
            └── api.ts                 # Backend API client
```

## File Descriptions

### Root Files
- **README.md**: Main documentation with architecture overview and setup instructions
- **PROJECT_EXPLANATION.md**: Detailed explanation of architecture, design decisions, and features
- **QUICK_START.md**: Step-by-step setup guide for quick start
- **package.json**: Workspace configuration with scripts to run both frontend and backend

### Backend Files

#### Core
- **server.ts**: Initializes Express server, connects to database/Redis, starts email worker
- **config/database.ts**: Database connection pool (supports MySQL and PostgreSQL)
- **config/redis.ts**: Redis client initialization for BullMQ

#### Database
- **database/migrate.ts**: Creates tables for scheduled_emails and sent_emails
- **models/EmailModel.ts**: Database operations (create, update, query emails)

#### Queue & Workers
- **queues/emailQueue.ts**: BullMQ queue setup with delayed job support
- **workers/emailWorker.ts**: Processes email jobs, handles rate limiting, updates status

#### Services
- **services/EmailService.ts**: Email sending via Ethereal Email (fake SMTP)
- **services/RateLimiter.ts**: Rate limiting per sender per hour using Redis

#### API
- **routes/emailRoutes.ts**: REST endpoints:
  - POST /api/schedule-email
  - POST /api/schedule-email-csv
  - GET /api/scheduled-emails
  - GET /api/sent-emails
- **middleware/errorHandler.ts**: Centralized error handling

### Frontend Files

#### Core
- **main.tsx**: React app entry with Google OAuth provider
- **App.tsx**: Root component with authentication routing
- **index.css**: Tailwind CSS imports

#### Components
- **components/Header.tsx**: App header with user avatar, name, email, logout
- **components/ComposeModal.tsx**: Modal form for scheduling emails (manual or CSV)
- **components/EmailTable.tsx**: Reusable table for displaying scheduled/sent emails

#### Pages
- **pages/Login.tsx**: Google OAuth login page
- **pages/Dashboard.tsx**: Main dashboard with tabs for scheduled/sent emails

#### Hooks & Services
- **hooks/useAuth.ts**: Authentication state management with Google OAuth
- **services/api.ts**: API client functions for backend communication

## Key Features by File

### Backend
- **Delayed Jobs**: `emailQueue.ts` - Uses BullMQ delays instead of cron
- **Rate Limiting**: `RateLimiter.ts` + BullMQ limiter in `emailWorker.ts`
- **Concurrency**: `emailWorker.ts` - Configurable concurrent processing
- **Persistence**: `EmailModel.ts` - All jobs stored in database
- **Email Sending**: `EmailService.ts` - Ethereal Email integration

### Frontend
- **Authentication**: `useAuth.ts` + `Login.tsx` - Google OAuth
- **Email Scheduling**: `ComposeModal.tsx` - Form with CSV support
- **Data Display**: `EmailTable.tsx` - Tables with loading/empty states
- **Dashboard**: `Dashboard.tsx` - Tabbed interface for scheduled/sent emails

## Environment Variables

### Backend (.env)
```
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=yourpassword
DB_NAME=reachinbox
DB_TYPE=mysql
REDIS_HOST=localhost
REDIS_PORT=6379
PORT=5000
HOURLY_EMAIL_LIMIT=100
QUEUE_CONCURRENCY=5
```

### Frontend (.env)
```
VITE_API_URL=http://localhost:5000
VITE_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
```

## Database Schema

### scheduled_emails
- id (primary key)
- job_id (unique)
- recipient_email
- subject
- body
- scheduled_time
- status (pending/processing/completed/failed)
- sender_email
- error_message
- created_at, updated_at

### sent_emails
- id (primary key)
- job_id (unique)
- recipient_email
- subject
- body
- scheduled_time
- sent_at
- sender_email
- ethereal_message_id
- created_at

## API Endpoints

- `POST /api/schedule-email` - Schedule emails manually
- `POST /api/schedule-email-csv` - Schedule emails from CSV
- `GET /api/scheduled-emails` - Get pending/processing emails
- `GET /api/sent-emails` - Get completed emails
- `GET /health` - Health check

This structure follows best practices for separation of concerns, modularity, and maintainability.
