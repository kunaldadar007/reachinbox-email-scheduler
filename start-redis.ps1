# Start Redis Server Script for Windows
# Run this before starting the application

Write-Host "🔴 Starting Redis server..." -ForegroundColor Yellow

# Check if Redis is already running
$redisRunning = Test-NetConnection -ComputerName 127.0.0.1 -Port 6379 -InformationLevel Quiet -WarningAction SilentlyContinue

if ($redisRunning) {
    Write-Host "✅ Redis is already running on port 6379" -ForegroundColor Green
    exit 0
}

# Try to start Redis server
$redisPath = "C:\Program Files\Redis\redis-server.exe"

if (Test-Path $redisPath) {
    Write-Host "Starting Redis from: $redisPath" -ForegroundColor Cyan
    Start-Process -FilePath $redisPath -WindowStyle Hidden
    
    # Wait a moment and check if it started
    Start-Sleep -Seconds 2
    
    $check = Test-NetConnection -ComputerName 127.0.0.1 -Port 6379 -InformationLevel Quiet -WarningAction SilentlyContinue
    if ($check) {
        Write-Host "✅ Redis started successfully!" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Redis may not have started. Try running manually:" -ForegroundColor Yellow
        Write-Host "   redis-server" -ForegroundColor White
    }
} else {
    Write-Host "❌ Redis not found at: $redisPath" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please install Redis or use Docker:" -ForegroundColor Yellow
    Write-Host "   Docker: docker run -d -p 6379:6379 redis:alpine" -ForegroundColor White
    Write-Host "   Or download from: https://github.com/microsoftarchive/redis/releases" -ForegroundColor White
    exit 1
}
