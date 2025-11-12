# 🧪 ML LEARNING SYSTEM - TESTING GUIDE

Quick reference for testing the ML learning system after deployment.

---

## 🎯 QUICK TEST COMMANDS

### **1. Test Cron Jobs (Manual Trigger)**

Replace with your actual values:
```bash
LIVE_URL="https://line-pointer-sports-fczhaoukv-jongreen716-7177s-projects.vercel.app"
CRON_SECRET="your_cron_secret_from_env"
```

#### Test Game Results Scraper
```bash
curl -X POST "$LIVE_URL/api/cron/update-game-results" \
  -H "Authorization: Bearer $CRON_SECRET" \
  -H "Content-Type: application/json" | jq
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Game results updated",
  "results": {
    "nfl": { "processed": 15, "updated": 10, "errors": 0 },
    "cfb": { "processed": 25, "updated": 18, "errors": 0 }
  }
}
```

#### Test Odds Collector
```bash
curl -X POST "$LIVE_URL/api/cron/collect-odds" \
  -H "Authorization: Bearer $CRON_SECRET" | jq
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Odds collection completed",
  "summary": {
    "totalGames": 20,
    "totalSnapshots": 20,
    "totalAlerts": 3
  }
}
```

#### Test Injury Collector
```bash
curl -X POST "$LIVE_URL/api/cron/collect-injuries" \
  -H "Authorization: Bearer $CRON_SECRET" | jq
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Injury reports collected",
  "results": {
    "nfl": { "fetched": 45, "stored": 12, "updated": 33 },
    "cfb": { "fetched": 30, "stored": 8, "updated": 22 }
  }
}
```

#### Test Weather Collector
```bash
curl -X POST "$LIVE_URL/api/cron/collect-weather" \
  -H "Authorization: Bearer $CRON_SECRET" | jq
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Weather data collected",
  "results": {
    "processed": 8,
    "updated": 8,
    "skipped": 0,
    "errors": 0
  }
}
```

#### Test Play-by-Play Collector
```bash
curl -X POST "$LIVE_URL/api/cron/collect-pbp" \
  -H "Authorization: Bearer $CRON_SECRET" | jq
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Play-by-play data collected",
  "years": [2024, 2025],
  "output": "✓ Fetched 45000 plays..."
}
```

---

### **2. Test Accuracy APIs (Browser or Authenticated)**

#### Option A: Browser (easiest)
1. Log in to your site
2. Open browser console (F12)
3. Run these commands:

```javascript
// Test stats
fetch('/api/accuracy/stats?sport=NFL')
  .then(r => r.json())
  .then(console.log);

// Test factor analysis
fetch('/api/accuracy/factors?sport=NFL&minSampleSize=20')
  .then(r => r.json())
  .then(console.log);

// Test export (Premium users only)
fetch('/api/accuracy/export?format=json&sport=NFL')
  .then(r => r.json())
  .then(console.log);
```

#### Option B: curl with session token

First, get your session token:
1. Log in to your site
2. Open DevTools → Application → Cookies
3. Copy the value of `next-auth.session-token`

```bash
SESSION_TOKEN="your_session_token_here"

# Test stats
curl "$LIVE_URL/api/accuracy/stats?sport=NFL" \
  -H "Cookie: next-auth.session-token=$SESSION_TOKEN" | jq

# Test factors
curl "$LIVE_URL/api/accuracy/factors?sport=NFL&minSampleSize=20" \
  -H "Cookie: next-auth.session-token=$SESSION_TOKEN" | jq

# Test export
curl "$LIVE_URL/api/accuracy/export?format=json&sport=NFL" \
  -H "Cookie: next-auth.session-token=$SESSION_TOKEN" | jq
```

**Expected Response (Stats):**
```json
{
  "success": true,
  "stats": {
    "totalPredictions": 150,
    "correctPredictions": 95,
    "accuracy": 0.633,
    "avgConfidence": 72.5,
    "avgSpreadCLV": 1.2,
    "beatTheCloseRate": 0.58,
    "byConfidenceRange": [...],
    "bySport": [...],
    "recentTrend": {
      "last10Accuracy": 0.70,
      "last25Accuracy": 0.65,
      "last50Accuracy": 0.63
    }
  }
}
```

**Expected Response (Factors):**
```json
{
  "success": true,
  "analysis": {
    "overallAccuracy": 0.633,
    "totalPredictions": 150,
    "strongPositiveFactors": [
      {
        "factor": "homeEPAPerPlay",
        "accuracy": 0.72,
        "sampleSize": 120
      }
    ],
    "insights": {
      "mostReliableFactors": ["homeEPAPerPlay", "lineMovement"],
      "leastReliableFactors": ["publicBettingPercent"]
    }
  }
}
```

---

### **3. Test Prediction Tracking (Automatic - Verify Database)**

The prediction tracker runs automatically. To verify it's working:

#### Check if predictions are being stored:
```sql
-- Run this in your Supabase SQL editor
SELECT
  COUNT(*) as total_predictions,
  COUNT(*) FILTER (WHERE "wasCorrect" IS NOT NULL) as completed,
  COUNT(*) FILTER (WHERE "wasCorrect" IS NULL) as pending,
  AVG(confidence) as avg_confidence,
  MAX("madeAt") as latest_prediction
FROM "Prediction";
```

#### Check if factors are being stored:
```sql
-- Sample some predictions with factors
SELECT
  "homeTeam",
  "awayTeam",
  "confidence",
  "wasCorrect",
  "spreadCLV",
  "beatTheCloseSpread",
  LEFT(factors::text, 100) as factors_preview
FROM "Prediction"
ORDER BY "madeAt" DESC
LIMIT 5;
```

#### Check predictions with results:
```sql
-- Predictions that have been updated with results
SELECT
  "homeTeam",
  "awayTeam",
  "predictedWinner",
  "actualWinner",
  "wasCorrect",
  "confidence",
  "spreadCLV",
  "beatTheCloseSpread"
FROM "Prediction"
WHERE "wasCorrect" IS NOT NULL
ORDER BY "resultsFetchedAt" DESC
LIMIT 10;
```

---

### **4. Test Python ML Training (Local)**

**Prerequisites:**
```bash
cd ml-service

# Install dependencies
pip install pandas numpy scikit-learn xgboost psycopg2-binary nfl_data_py joblib

# Set database URL
export POSTGRES_PRISMA_URL="your_supabase_url_here"
```

#### Test with NFL data:
```bash
# Run training (need 50+ predictions with results)
python train_model.py --sport NFL

# Expected output:
# ======================================================================
#   COMPREHENSIVE ML TRAINING PIPELINE - NFL
#   2025-11-12 14:30:00
# ======================================================================
#
# ✓ Dataset: 150 predictions
#   Accuracy: 63.3%
#   CLV Beat Rate: 58.0%
#
# ✓ Engineered 45 features
#   Top features: homeOffensiveEff, awayDefensiveEff, lineMovement...
#
# Training Ensemble Models
# ======================================================================
#
# [1/3] Training Random Forest...
#   ✓ Accuracy: 0.6800
#
# [2/3] Training Gradient Boosting...
#   ✓ Accuracy: 0.7000
#
# [3/3] Training XGBoost...
#   ✓ Accuracy: 0.7200
#
# BEST MODEL: XGBOOST
# F1 Score: 0.7200
# ======================================================================
```

#### Check saved models:
```bash
ls -la models/
# Should see:
# nfl_xgboost_model.pkl
# nfl_scaler.pkl
# nfl_features.json
```

---

## 🔍 VERIFICATION CHECKLIST

### **After First Deployment:**

- [ ] All 5 cron jobs return success (no 500 errors)
- [ ] Cron jobs are scheduled in Vercel dashboard
- [ ] Environment variables are set (check Vercel dashboard)
- [ ] Database tables exist (Prediction, Game, Player, etc.)
- [ ] Can access accuracy APIs when logged in
- [ ] Predictions are being stored with factors

### **After First Week:**

- [ ] Predictions have been made (check Prediction table)
- [ ] Some games have completed and results updated
- [ ] Can see accuracy stats (even if low sample size)
- [ ] Odds data is being collected (check OddsHistory table)
- [ ] Injury data is being collected (check Player table)
- [ ] Weather data is being collected (check Game table)

### **After First Month (50+ predictions with results):**

- [ ] Can run Python ML training successfully
- [ ] Models are saved in ml-service/models/
- [ ] Factor correlation analysis works
- [ ] Can identify which factors correlate with accuracy
- [ ] Can export training data
- [ ] Models show improving accuracy over time

---

## 🐛 TROUBLESHOOTING

### **Cron job returns 401 Unauthorized:**
- Check CRON_SECRET is set in Vercel environment variables
- Verify Authorization header format: `Bearer your_secret`

### **Cron job returns 500 Internal Server Error:**
- Check Vercel function logs
- Verify API keys are set (ODDS_API_KEY, OPENWEATHER_API_KEY)
- Check database connection (POSTGRES_PRISMA_URL)

### **Accuracy API returns "Unauthorized":**
- Make sure you're logged in
- Check NextAuth session is valid
- Verify authOptions configuration

### **Accuracy API returns "Insufficient data":**
- Normal if you have < 50 predictions with results
- Wait for more games to complete
- Try lowering minSampleSize parameter

### **Python training fails:**
- Check database connection: `psql $POSTGRES_PRISMA_URL`
- Verify dependencies installed: `pip list | grep -E "pandas|numpy|sklearn|xgboost"`
- Check you have 50+ predictions: Run SQL query above

### **Factor analysis returns empty results:**
- Check factors are being stored as JSON in Prediction table
- Verify predictions have wasCorrect values (not null)
- Try with sport filter: `?sport=NFL`

---

## 📊 MONITORING & MAINTENANCE

### **Weekly Checks:**
```bash
# Check cron job runs (Vercel dashboard)
# Check prediction count growth
# Check accuracy trends
# Verify API usage (The Odds API, OpenWeatherMap)
```

### **Monthly Tasks:**
```bash
# Retrain ML models if accuracy drops
# Review factor correlations
# Update feature weights based on analysis
# Check for model drift
```

### **API Usage Monitoring:**
- The Odds API: https://the-odds-api.com/account
- OpenWeatherMap: https://openweathermap.org/price
- Target: Stay under free tier limits

---

## ✅ SUCCESS METRICS

### **Short-term (Week 1-2):**
- ✅ All cron jobs running without errors
- ✅ Predictions being stored with 50+ factors
- ✅ Some predictions have results (wasCorrect not null)
- ✅ Odds/weather/injury data being collected

### **Medium-term (Month 1):**
- ✅ 50+ predictions with results
- ✅ First ML model trained successfully
- ✅ Factor correlation analysis working
- ✅ Overall accuracy > 55% (baseline)
- ✅ CLV positive (beating opening lines)

### **Long-term (Month 2+):**
- ✅ Accuracy improving over time (>60%)
- ✅ Strong factor correlations identified
- ✅ Beating closing lines consistently (>52%)
- ✅ Models getting smarter with more data
- ✅ Can predict which factors lead to success

---

**Quick Commands Reference:**

```bash
# Set these once:
export LIVE_URL="https://your-site.vercel.app"
export CRON_SECRET="your_secret"
export SESSION_TOKEN="your_session_token"

# Then test everything:
curl -X POST "$LIVE_URL/api/cron/update-game-results" -H "Authorization: Bearer $CRON_SECRET" | jq
curl "$LIVE_URL/api/accuracy/stats" -H "Cookie: next-auth.session-token=$SESSION_TOKEN" | jq
python ml-service/train_model.py --sport NFL
```

---

**Last Updated:** 2025-11-12
**Status:** Ready for post-deployment testing 🧪
