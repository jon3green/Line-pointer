# Phase 2 Quick Start Guide
**Real-Time Odds Collection & Line Movement Tracking**

## 🚀 What's New

You now have:
- ✅ Automated odds collection (daily at 8 AM UTC)
- ✅ Line movement detection and alerts
- ✅ Real-time alerts on homepage
- ✅ Historical odds tracking
- ✅ Sharp money identification

---

## 🔑 Required Setup

### 1. Environment Variables (Vercel Dashboard)

Go to: Vercel Dashboard → Your Project → Settings → Environment Variables

Add these if not already set:

```bash
# Required
NEXT_PUBLIC_ODDS_API_KEY=QWtNEFAlxm7Z3BRjUc40maHOt03HqCNgqgdAMjzTY
DATABASE_URL=your_production_database_url

# Optional (recommended for security)
CRON_SECRET=your_random_secret_here
```

After adding, redeploy:
```bash
vercel --prod
```

---

## 📅 Cron Job (Important!)

### Current Configuration
- **Schedule:** Once daily at 8 AM UTC
- **Reason:** Vercel Hobby tier limitation

### To Enable 5-Minute Collection (Recommended)

**Upgrade to Vercel Pro** ($20/month):
1. Go to Vercel Dashboard → Settings → Billing
2. Upgrade to Pro plan
3. Update `vercel.json`:
   ```json
   "crons": [{
     "path": "/api/cron/collect-odds",
     "schedule": "*/5 * * * *"  // Every 5 minutes
   }]
   ```
4. Redeploy: `vercel --prod`

**Result:** 288 collections/day instead of 1/day

---

## 🧪 Testing Your Deployment

### 1. Check Homepage
Visit: `https://line-pointer-sports-8b3n3wusc-jongreen716-7177s-projects.vercel.app`

Look for:
- New "Line Movement Alerts" component (right sidebar)
- Empty state message (until first collection runs)

### 2. Verify Cron Job
1. Go to Vercel Dashboard
2. Navigate to: Functions → Cron Jobs
3. Confirm: `/api/cron/collect-odds` appears with schedule `0 8 * * *`

### 3. Manual Collection Test
Trigger immediate odds collection:

```bash
curl -X POST https://your-domain/api/odds/collect \
  -H "Content-Type: application/json" \
  -d '{"sport": "all"}'
```

Expected response:
```json
{
  "success": true,
  "message": "Odds collection completed",
  "results": [
    {
      "sport": "NFL",
      "gamesProcessed": 15,
      "oddsSnapshotsSaved": 15,
      "alertsCreated": 3
    }
  ]
}
```

### 4. Check Database
Open Prisma Studio:
```bash
npx prisma studio
```

Verify tables:
- `OddsHistory` - Should have rows after first collection
- `LineMovementAlert` - Should have alerts if significant moves detected

---

## 📊 Monitoring

### Daily Checks (First Week)

**Check Cron Execution:**
```bash
vercel logs --follow
```

At 8:05 AM UTC, look for:
```
[Cron] Starting odds collection: 2025-11-11T08:00:00.000Z
[Cron] Odds collection completed: { totalGames: 45, totalSnapshots: 45, totalAlerts: 8 }
```

**Check API Usage:**
- The Odds API Dashboard: https://the-odds-api.com/account
- Should see 1-2 requests per day
- Free tier limit: 500 requests/month

**Check Database Growth:**
```bash
# Production database
DATABASE_URL="your_prod_url" npx prisma studio
```

Expected growth:
- Day 1: ~50 OddsHistory records
- Week 1: ~350 records
- Month 1: ~1,500 records

---

## 🚨 Alerts Explained

### Alert Types

1. **Steam Move** (High/Critical Severity)
   - Line moved >1 point in <15 minutes
   - Indicates sharp/professional money
   - Action: Consider following the move

2. **Significant Move** (Medium/High Severity)
   - Line moved >2 points from opening
   - Sustained movement over time
   - Action: Research why the line moved

3. **Reverse Line Movement (RLM)** (Medium Severity)
   - Line moves opposite of public betting
   - Indicates sharp money against public
   - Action: Strong contrarian indicator

### Alert UI Features
- **Color-coded severity:** Red (critical) → Orange (high) → Yellow (medium) → Blue (low)
- **Auto-refresh:** Every 60 seconds
- **Click to dismiss:** Mark alerts as read
- **Game links:** Direct navigation to analysis page
- **Time tracking:** "Just now", "5 mins ago", etc.

---

## 🔧 Manual Collection (Alternative to Cron)

If you don't upgrade to Pro, you can manually trigger collection:

### Local Script
Create `scripts/collect-odds.sh`:
```bash
#!/bin/bash
curl -X POST https://your-production-domain/api/odds/collect \
  -H "Content-Type: application/json" \
  -d '{"sport": "all"}'
```

### Suggested Schedule
Run before key betting windows:
- **7:00 AM ET** - Morning lines
- **1:00 PM ET** - Afternoon adjustments
- **6:00 PM ET** - Evening sharp money

### External Cron Service
Use free services like:
- **cron-job.org** (free, unlimited)
- **EasyCron** (free tier available)
- **GitHub Actions** (free, built-in)

Example GitHub Action:
```yaml
name: Collect Odds
on:
  schedule:
    - cron: '*/5 * * * *'  # Every 5 minutes
jobs:
  collect:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger Collection
        run: |
          curl -X POST ${{ secrets.APP_URL }}/api/odds/collect \
            -H "Content-Type: application/json" \
            -d '{"sport": "all"}'
```

---

## 📈 Expected Results

### Week 1
- **Odds Snapshots:** 350+ collected
- **Alerts Generated:** 20-50 (depending on games)
- **API Usage:** 7-14 requests (well under 500/month limit)
- **Accuracy Impact:** Baseline established

### Month 1
- **Odds Snapshots:** 1,500+ collected
- **Alerts Generated:** 100-200
- **Accuracy Improvement:** +0.5-1.5% measurable
- **Sharp Money Patterns:** Identified and documented

### Month 3
- **Odds Snapshots:** 4,500+ collected
- **Historical Analysis:** Deep trend patterns available
- **Accuracy Improvement:** +1.8-3.5% target reached
- **Ready for Phase 3:** Advanced features unlocked

---

## 🐛 Troubleshooting

### No Alerts Showing
**Possible Causes:**
1. Cron hasn't run yet (wait until 8 AM UTC)
2. No significant line movements today
3. Database connection issue

**Fix:**
```bash
# Trigger manual collection
curl -X POST https://your-domain/api/odds/collect -H "Content-Type: application/json" -d '{"sport": "NFL"}'

# Check database
npx prisma studio
```

### API Key Errors
**Error:** "Invalid API key" or 401/403 responses

**Fix:**
1. Verify API key in Vercel environment variables
2. Check The Odds API account status
3. Ensure key has correct permissions

### Cron Not Running
**Check:**
1. Vercel Dashboard → Functions → Cron Jobs
2. Should see `/api/cron/collect-odds` listed
3. Check deployment logs at 8:05 AM UTC

**Fix:**
```bash
# Redeploy to register cron
vercel --prod
```

### Database Errors
**Error:** "Prisma Client not initialized"

**Fix:**
```bash
# Regenerate Prisma Client
npx prisma generate

# Push schema
npx prisma db push

# Redeploy
vercel --prod
```

---

## 📚 Next Steps

### Immediate (Today)
1. ✅ Deployment complete
2. ⬜ Verify homepage loads
3. ⬜ Check Vercel cron configuration
4. ⬜ Set CRON_SECRET environment variable
5. ⬜ Test manual collection

### Tomorrow
1. ⬜ Check logs at 8:05 AM UTC for first cron run
2. ⬜ Verify OddsHistory records created
3. ⬜ Check if any alerts were generated
4. ⬜ Monitor for errors

### This Week
1. ⬜ Collect 7 days of baseline data
2. ⬜ Review alert accuracy and thresholds
3. ⬜ Consider upgrading to Pro for 5-min collection
4. ⬜ Plan Phase 3 features

### Phase 3 (Future)
- Line movement charts on game pages
- Closing Line Value (CLV) tracking
- Historical trend dashboard
- Bet timing recommendations
- Push notifications for critical alerts

---

## 🎯 Success Criteria

### ✅ You're Ready When:
- [ ] Homepage loads with LineMovementAlerts component
- [ ] Cron job appears in Vercel dashboard
- [ ] Manual collection endpoint returns success
- [ ] Database has OddsHistory and LineMovementAlert tables
- [ ] First automated collection runs tomorrow at 8 AM UTC
- [ ] At least one alert generated in first week

---

## 📞 Support

### Documentation
- **Full Guide:** `PHASE_2_COMPLETE.md`
- **Deployment Log:** `DEPLOYMENT_SUMMARY.md`
- **ML Strategy:** `docs/ML_STRATEGY.md`

### Resources
- **The Odds API Docs:** https://the-odds-api.com/liveapi/guides/v4/
- **Vercel Cron Docs:** https://vercel.com/docs/cron-jobs
- **Prisma Docs:** https://www.prisma.io/docs

### Issues
- **GitHub:** https://github.com/jon3green/Line-pointer/issues
- **The Odds API Support:** support@the-odds-api.com
- **Vercel Support:** https://vercel.com/support

---

**🎉 Phase 2 Complete! Your app now has real-time odds collection and line movement tracking.**

Next: Monitor for 7 days → Analyze results → Deploy Phase 3
