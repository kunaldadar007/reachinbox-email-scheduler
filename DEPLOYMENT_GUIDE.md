# Render Deployment Guide

## Connection Strings Format

### Supabase PostgreSQL
- Go to: Supabase Dashboard → Settings → Database
- Look for: "Connection string"
- Copy the **URI** format
- Format: `postgresql://postgres:[YOUR_PASSWORD]@db.[PROJECT_ID].supabase.co:5432/postgres`

### Redis Cloud
- Go to: Redis Cloud → Databases
- Find your database
- Look for: "Public endpoint"
- Format: `redis://default:[PASSWORD]@[HOST]:[PORT]`

## Render Deployment Steps

1. Go to render.com
2. Click "New" → "Blueprint"
3. Select repo: `kunaldadar007/reachinbox-email-scheduler`
4. Fill environment variables from above
5. Deploy

## Frontend Update

After Render deployment, update:
```
VITE_API_URL=https://YOUR-RENDER-BACKEND-URL.onrender.com
```
