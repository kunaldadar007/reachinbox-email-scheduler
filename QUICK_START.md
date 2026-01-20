# Quick Start Guide

## Prerequisites Installation

### 1. Install Node.js
Download and install Node.js 18+ from https://nodejs.org/

### 2. Install Redis

**Windows:**
```powershell
# Using Chocolatey
choco install redis-64

# Or download from: https://github.com/microsoftarchive/redis/releases
```

**Mac:**
```bash
brew install redis
```

**Linux:**
```bash
sudo apt-get install redis-server
```

**Or use Docker:**
```bash
docker run -d -p 6379:6379 redis:alpine
```

### 3. Install MySQL or PostgreSQL

**MySQL:**
- Download from https://dev.mysql.com/downloads/mysql/
- Or use Docker: `docker run -d -p 3306:3306 -e MYSQL_ROOT_PASSWORD=root mysql:8`

**PostgreSQL:**
- Download from https://www.postgresql.org/download/
- Or use Docker: `docker run -d -p 5432:5432 -e POSTGRES_PASSWORD=postgres postgres:14`

## Setup Steps

### Step 1: Install Dependencies

```bash
cd reachinbox
npm run install:all
```

### Step 2: Configure Backend

```bash
cd backend
copy .env.example .env  # Windows
# or
cp .env.example .env    # Mac/Linux
```

Edit `backend/.env`:
```env
DB_HOST=localhost
DB_PORT=3306          # 5432 for PostgreSQL
DB_USER=root          # postgres for PostgreSQL
DB_PASSWORD=yourpassword
DB_NAME=reachinbox
DB_TYPE=mysql         # or 'postgres'

REDIS_HOST=localhost
REDIS_PORT=6379

PORT=5000
HOURLY_EMAIL_LIMIT=100
QUEUE_CONCURRENCY=5
```

### Step 3: Configure Frontend

```bash
cd frontend
copy .env.example .env  # Windows
# or
cp .env.example .env    # Mac/Linux
```

Edit `frontend/.env`:
```env
VITE_API_URL=http://localhost:5000
VITE_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
```

**To get Google OAuth Client ID:**
1. Go to https://console.cloud.google.com/
2. Create a new project
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add `http://localhost:5173` to authorized JavaScript origins
6. Copy the Client ID to `.env`

### Step 4: Initialize Database

```bash
cd backend
npm run migrate
```

This creates the necessary tables.

### Step 5: Start Redis

**Windows (if installed):**
```powershell
redis-server
```

**Mac/Linux:**
```bash
redis-server
```

**Or verify Redis is running:**
```bash
redis-cli ping
# Should return: PONG
```

### Step 6: Start the Application

**Option A: Run both together (recommended)**
```bash
# From root directory
npm run dev
```

**Option B: Run separately**

Terminal 1 (Backend):
```bash
cd backend
npm run dev
```

Terminal 2 (Frontend):
```bash
cd frontend
npm run dev
```

### Step 7: Access the Application

- Frontend: http://localhost:5173
- Backend API: http://localhost:5000
- Health Check: http://localhost:5000/health

## Testing the Application

1. **Login:** Click "Sign in with Google" and authenticate
2. **Compose Email:**
   - Click "Compose Email" button
   - Enter subject: "Test Email"
   - Enter body: "This is a test email"
   - Enter recipients: `test1@example.com, test2@example.com`
   - Set start time to 1-2 minutes in the future
   - Set delay to 5000ms (5 seconds)
   - Click "Schedule X Email(s)"
3. **View Scheduled:** Check "Scheduled Emails" tab
4. **Wait for Processing:** Emails will be sent automatically
5. **View Sent:** Check "Sent Emails" tab after processing
6. **Verify in Ethereal:** Check console for Ethereal credentials and visit https://ethereal.email to see sent emails

## Troubleshooting

### Redis Connection Error
- Ensure Redis is running: `redis-cli ping`
- Check Redis port in `.env` matches your Redis setup

### Database Connection Error
- Verify database is running
- Check credentials in `backend/.env`
- Ensure database `reachinbox` exists (create it manually if needed)

### Port Already in Use
- Change `PORT` in `backend/.env`
- Change port in `frontend/vite.config.ts`

### Google OAuth Not Working
- Verify Client ID is correct
- Ensure `http://localhost:5173` is in authorized origins
- Check browser console for errors

### Emails Not Sending
- Check backend console for errors
- Verify Ethereal Email service initialized (check console logs)
- Check rate limit hasn't been exceeded
- Verify jobs are in Redis queue: `redis-cli KEYS "*email-queue*"`

## Demo Tips

- Keep email batches small (5-10 emails) for quick demos
- Set start time to 1-2 minutes in the future
- Use 5-second delays between emails for visible progression
- Monitor backend console for job processing logs
- Check Ethereal Email web interface to verify emails
