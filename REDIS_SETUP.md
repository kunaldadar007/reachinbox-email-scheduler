# Redis Setup Guide

## Quick Start

**Before running `npm run dev`, start Redis:**

### Option 1: PowerShell Script (Easiest)
```powershell
.\start-redis.ps1
```

### Option 2: Manual Start
```powershell
redis-server
```

### Option 3: Docker (if installed)
```powershell
docker run -d -p 6379:6379 --name redis redis:alpine
```

## Verify Redis is Running

```powershell
Test-NetConnection -ComputerName 127.0.0.1 -Port 6379
```

Or use Redis CLI:
```powershell
redis-cli ping
# Should return: PONG
```

## Windows Service (Optional)

To run Redis as a Windows service:

1. Install Redis as a service (if using Memurai or similar)
2. Or use NSSM (Non-Sucking Service Manager) to install redis-server as a service

## Troubleshooting

### Error: ECONNREFUSED
- **Cause:** Redis server is not running
- **Solution:** Start Redis using one of the methods above

### Error: Port 6379 already in use
- **Cause:** Another Redis instance is running
- **Solution:** 
  - Stop the other instance, or
  - Change `REDIS_PORT` in `.env` to a different port

### Redis not found
- **Install Redis for Windows:**
  - Download from: https://github.com/microsoftarchive/redis/releases
  - Or use Chocolatey: `choco install redis-64`
  - Or use Docker: `docker run -d -p 6379:6379 redis:alpine`

## Auto-Start Script

You can modify `package.json` to auto-start Redis:

```json
"scripts": {
  "dev": "powershell -File start-redis.ps1; concurrently \"npm run dev:backend\" \"npm run dev:frontend\""
}
```

But it's better to start Redis separately so it stays running.
