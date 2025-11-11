# Automated Odds Collection Setup

This guide walks you through setting up automated odds collection using cron-job.org (free).

## Your Production Endpoint

**URL:** `https://line-pointer-sports-1du6k0hny-jongreen716-7177s-projects.vercel.app/api/cron/collect-odds`

**Authentication Required:** Yes (Bearer token in Authorization header)

**CRON_SECRET:** `jk7hg9sd8fh3jk4hg5fd6gh7j8k9hgf0d1s2a3f4g5h6`

---

## Step-by-Step Setup with cron-job.org

### 1. Sign Up for cron-job.org

1. Go to https://cron-job.org
2. Click "Sign up" (top right)
3. Enter your email and create a password
4. Verify your email address

### 2. Create a New Cron Job

1. After logging in, click **"Create cronjob"** button
2. Fill in the form:

**Title:**
```
LinePointer - Collect Odds
```

**Address (URL):**
```
https://line-pointer-sports-1du6k0hny-jongreen716-7177s-projects.vercel.app/api/cron/collect-odds
```

**Schedule:**
- Select **"Every 6 hours"** from the dropdown
- Or use custom: `0 */6 * * *`

This will run at: 12:00 AM, 6:00 AM, 12:00 PM, 6:00 PM (UTC)

### 3. Configure Request Settings

Click **"Advanced"** to show more options:

**Request Method:**
- Select `POST`

**Headers:**
Click "Add header" and enter:
- **Name:** `Authorization`
- **Value:** `Bearer jk7hg9sd8fh3jk4hg5fd6gh7j8k9hgf0d1s2a3f4g5h6`

**Timeout:**
- Set to `120` seconds (odds collection can take 30-60 seconds)

**Notification settings:**
- ✅ Enable "Notify me on failed executions"
- Enter your email

### 4. Save and Activate

1. Click **"Create cronjob"**
2. The job will appear in your dashboard
3. Status should show "Active" with a green indicator

### 5. Test the Cron Job

**Option 1: Manual Test from Dashboard**
1. Find your cron job in the list
2. Click the "▶ Run" button
3. Wait 30-60 seconds
4. Check the execution log for status 200

**Option 2: Test from Command Line**
```bash
curl -X POST "https://line-pointer-sports-1du6k0hny-jongreen716-7177s-projects.vercel.app/api/cron/collect-odds" \
  -H "Authorization: Bearer jk7hg9sd8fh3jk4hg5fd6gh7j8k9hgf0d1s2a3f4g5h6" \
  -w "\nHTTP Status: %{http_code}\n"
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Odds collection completed",
  "summary": {
    "totalGames": 20,
    "totalSnapshots": 20,
    "totalAlerts": 0,
    "totalErrors": 0
  }
}
```

---

## Monitoring

### Check Execution History

1. Go to cron-job.org dashboard
2. Click on "LinePointer - Collect Odds"
3. View "Execution history" tab
4. Look for:
   - ✅ Green checkmarks (success)
   - ❌ Red X marks (failures)
   - Response times

### Monitor in Vercel

```bash
vercel logs --prod --since=6h
```

Look for lines like:
```
[Cron] Starting odds collection: 2025-11-11T14:00:00.000Z
[Cron] Collected 20 games, saved 20 snapshots
```

### Monitor Database Growth

Check Supabase dashboard or run:
```bash
POSTGRES_PRISMA_URL="your-url" npx tsx -e "
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
const count = await prisma.oddsHistory.count();
console.log('Total odds snapshots:', count);
await prisma.\$disconnect();
"
```

---

## Recommended Schedule

### For Free Tier (500 API requests/month)

**Every 6 hours** (4 times/day)
- Uses ~8 API requests/day (4 collections × 2 sports)
- Monthly: ~240 requests
- Leaves 260 requests for manual refreshes

**Schedule times (UTC):**
- 00:00 (8:00 PM EST) - Evening games
- 06:00 (2:00 AM EST) - Overnight adjustments
- 12:00 (8:00 AM EST) - Morning lines
- 18:00 (2:00 PM EST) - Afternoon updates

### For Paid Tier (10,000 requests/month)

**Every 2 hours** (12 times/day)
- Uses ~24 API requests/day
- Monthly: ~720 requests
- Much fresher odds data

---

## Troubleshooting

### Issue: Cron job shows "Failed" status

**Check:**
1. Verify the URL is correct
2. Check Authorization header is exactly: `Bearer jk7hg9sd8fh3jk4hg5fd6gh7j8k9hgf0d1s2a3f4g5h6`
3. Increase timeout to 120 seconds
4. Check Vercel logs for errors

### Issue: Status 401 "Unauthorized"

**Solution:**
- Verify CRON_SECRET environment variable in Vercel matches your Bearer token
- Check there's no extra whitespace or newline in the token

```bash
# Verify production secret
vercel env pull .env.production
grep CRON_SECRET .env.production
```

### Issue: Timeout / No Response

**Solution:**
- Increase timeout to 180 seconds in cron-job.org settings
- The Odds API might be slow during high traffic times

### Issue: Too Many API Requests

**Solution:**
- Reduce frequency to every 12 hours: `0 */12 * * *`
- Or daily: `0 12 * * *` (noon UTC)

---

## Alternative: EasyCron

If cron-job.org doesn't work, try EasyCron:

1. Go to https://www.easycron.com
2. Sign up (free tier: 20 cron jobs)
3. Create new cron job
4. Enter same URL and settings as above
5. EasyCron has better timeout handling (up to 5 minutes)

---

## Future: Vercel Pro ($20/month)

When you upgrade to Vercel Pro:

1. The cron configuration in `vercel.json` will activate automatically
2. No need for external service
3. Better reliability and logging
4. Can use hourly schedules

To activate:
```bash
vercel --prod --yes
# Vercel will automatically set up the cron job
```

---

## API Usage Tracking

Check remaining requests:
```bash
curl -I "https://api.the-odds-api.com/v4/sports/?apiKey=aa46d4c76d1629f343a23b45caff2505" | grep remaining
```

Output shows: `x-requests-remaining: 482`

---

## Success Metrics

After 24 hours, you should see:
- ✅ 4 successful cron executions
- ✅ 80+ odds snapshots in database (20 games × 4 runs)
- ✅ ~8 API requests used from The Odds API
- ✅ No failed executions in cron-job.org
