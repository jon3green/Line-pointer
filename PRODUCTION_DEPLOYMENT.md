# Production Deployment Guide

This guide walks through deploying your sports prediction platform to production with real live data.

## Overview

Your platform has 3 main components:
1. **The Odds API** - Live sports odds data
2. **ML Service** - Python FastAPI for predictions
3. **Vercel Postgres** - Production database

---

## Step 1: Set Up Vercel Postgres

### 1.1 Create Database
1. Go to https://vercel.com/dashboard/stores
2. Click "Create Database" → "Postgres"
3. Name it: `line-pointer-db`
4. Select region closest to your users
5. Click "Create"

### 1.2 Get Connection Strings
After creation, Vercel will show you these variables:
```
POSTGRES_URL=
POSTGRES_PRISMA_URL=
POSTGRES_URL_NON_POOLING=
```

### 1.3 Add to Vercel Project
1. Go to your project settings: https://vercel.com/jongreen716-7177s-projects/line-pointer-sports/settings/environment-variables
2. Add each variable from above
3. Also add:
   ```
   ODDS_API_KEY=QWtNEFAlxm7Z3BRjUc40maHOt03HqCNgqgdAMjzT
   CRON_SECRET=generate-random-32-char-string
   ```

### 1.4 Run Database Migration
```bash
# Pull environment variables
vercel env pull .env.local

# Run Prisma migration
npx prisma migrate deploy

# Generate Prisma client
npx prisma generate
```

---

## Step 2: Deploy ML Service to Railway

### 2.1 Sign Up for Railway
1. Go to https://railway.app
2. Sign up with GitHub
3. Click "New Project" → "Deploy from GitHub repo"
4. Select your `Line-pointer` repository

### 2.2 Configure ML Service
1. Set root directory: `ml-service`
2. Add start command: `uvicorn serve:app --host 0.0.0.0 --port $PORT`
3. Railway will auto-detect Python and install dependencies

### 2.3 Get Service URL
After deployment, Railway gives you a URL like:
```
https://line-pointer-ml-production.up.railway.app
```

### 2.4 Add to Vercel
Go back to Vercel environment variables and add:
```
ML_SERVICE_URL=https://your-railway-url.railway.app
```

---

## Step 3: Configure The Odds API

### 3.1 Sign Up for API Key
1. Go to https://the-odds-api.com
2. Click "Get API Key"
3. Sign up with your email
4. You'll receive an API key like: `a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6`

### 3.2 Add to Vercel
Go to your Vercel project environment variables and add:
```
ODDS_API_KEY=your-actual-api-key-here
```

### 3.3 Test API Connection
```bash
curl "https://api.the-odds-api.com/v4/sports/?apiKey=YOUR_ACTUAL_KEY"
```

Should return list of available sports like:
```json
[
  {"key": "americanfootball_nfl", "title": "NFL", ...},
  {"key": "americanfootball_ncaaf", "title": "NCAAF", ...}
]
```

### 3.3 Check Usage Limits
Free tier: 500 requests/month
- Each cron run uses ~2 requests (NFL + NCAAF)
- Daily updates = 60 requests/month
- Leaves 440 for manual refreshes

---

## Step 4: Deploy to Production

### 4.1 Commit Changes
```bash
git add .
git commit -m "Production setup: Odds API + ML Service + Postgres"
git push origin main
```

### 4.2 Vercel Auto-Deploy
Vercel will automatically deploy when you push to `main`.

### 4.3 Verify Deployment
1. Check build logs: https://vercel.com/jongreen716-7177s-projects/line-pointer-sports
2. Visit your site
3. Test odds collection: `curl https://your-site.vercel.app/api/cron/collect-odds`

---

## Step 5: Test Everything

### 5.1 Manual Trigger Odds Collection
```bash
curl -X POST https://your-site.vercel.app/api/cron/collect-odds \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

### 5.2 Check Database
```bash
npx prisma studio
```

Should see games and odds in the database.

### 5.3 Test ML Predictions
```bash
curl https://your-railway-url.railway.app/health
```

Should return: `{"status": "healthy", ...}`

---

## Monitoring

### Daily Checks
- Vercel cron logs: https://vercel.com/jongreen716-7177s-projects/line-pointer-sports/logs
- Railway ML service: https://railway.app/dashboard
- Odds API quota: Check response headers

### API Usage
Monitor your Odds API usage:
```bash
curl -I "https://api.the-odds-api.com/v4/sports/?apiKey=YOUR_KEY"
# Check x-requests-remaining header
```

---

## Costs

| Service | Plan | Cost | Notes |
|---------|------|------|-------|
| Vercel | Hobby | $0 | Daily cron only |
| Railway | Free | $0 | $5 credit/month |
| The Odds API | Free | $0 | 500 requests/month |
| **Total** | | **$0/month** | |

### To Scale:
- **Vercel Pro** ($20/month) - Hourly crons
- **Railway Pro** ($20/month) - Better ML performance
- **Odds API Starter** ($50/month) - 10,000 requests

---

## Troubleshooting

### Odds Not Updating
1. Check cron logs in Vercel
2. Verify ODDS_API_KEY is set
3. Check API quota: `curl -I https://api.the-odds-api.com/v4/sports/?apiKey=YOUR_KEY`

### ML Predictions Failing
1. Check Railway logs
2. Verify ML_SERVICE_URL is correct
3. Test health endpoint: `curl https://your-ml-service.railway.app/health`

### Database Errors
1. Check Postgres connection strings
2. Run migrations: `npx prisma migrate deploy`
3. Regenerate client: `npx prisma generate`

---

## Next Steps

Once everything is running:
1. ✅ Monitor first 24 hours of data collection
2. ✅ Verify ML predictions are accurate
3. ✅ Check parlay generator with real odds
4. 🚀 Launch to users!

---

## Support

- Vercel Docs: https://vercel.com/docs
- Railway Docs: https://docs.railway.app
- The Odds API Docs: https://the-odds-api.com/liveapi/guides/v4
- Prisma Docs: https://www.prisma.io/docs
