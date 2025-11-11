# Python ML Service for Sports Predictions

Professional-grade machine learning service using XGBoost for sports prediction.

## Overview

This Python ML service trains XGBoost models on historical game data and serves predictions via a FastAPI REST API. It complements the existing TypeScript ML models with a more powerful, dedicated ML stack.

## Architecture

```
ml-service/
├── venv/                  # Python virtual environment
├── data/                  # Training data (generated)
├── models/                # Trained models (generated)
├── train_model.py         # Training script
├── serve.py               # FastAPI prediction service
├── requirements.txt       # Python dependencies
└── README.md             # This file
```

## Quick Start (3 Hours Total)

### 1. Install Python Dependencies (10 min)

Already done! Virtual environment created with:
- xgboost v3.1.1
- scikit-learn v1.7.2
- pandas v2.3.3
- fastapi v0.121.1

### 2. Export Training Data (5 min)

```bash
# Compile and run the export script
npx tsx scripts/export-training-data.ts
```

This exports historical predictions from your database to `ml-service/data/training_data.csv`.

**Note:** You need at least 100 completed games for reliable training. If you don't have enough data yet, continue running Phase 2 odds collection for a few more days.

### 3. Train XGBoost Models (1-2 hours)

```bash
# Activate virtual environment
source ml-service/venv/bin/activate

# Train models
python ml-service/train_model.py
```

**What it does:**
- Loads training data from CSV
- Engineers 20+ features (spread movement, CLV, timing, etc.)
- Trains 2 XGBoost models:
  - **Winner Model**: Predicts if pick will be correct
  - **Spread Model**: Predicts if bet beats the spread
- Cross-validates with 5-fold CV
- Saves models and performance metrics

**Expected Output:**
```
[Train] Loaded 250 training examples
[Train] Winner Model Accuracy: 0.5800 (58.00%)
[Train] Cross-validation accuracy: 0.5650 (+/- 0.0320)
[Train] Spread Model Accuracy: 0.5450 (54.50%)
```

### 4. Deploy ML Service (30 min)

#### Local Deployment (Testing)

```bash
# Start FastAPI service
source ml-service/venv/bin/activate
python ml-service/serve.py
```

Service runs on `http://localhost:8000`

- API Docs: http://localhost:8000/docs
- Health Check: http://localhost:8000/health
- Metrics: http://localhost:8000/metrics

#### Production Deployment (Railway/Fly.io)

**Option A: Railway**

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Deploy
railway init
railway up
```

**Option B: Fly.io**

```bash
# Install Fly CLI
curl -L https://fly.io/install.sh | sh

# Login
fly auth login

# Deploy
fly launch
```

Cost: ~$5-10/month for basic ML service

### 5. Connect to Next.js App

Create API client in `lib/api/ml-service.ts`:

```typescript
const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000';

export async function getPredictionFromML(gameData: GameInput) {
  const response = await fetch(`${ML_SERVICE_URL}/predict`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(gameData),
  });
  return response.json();
}
```

---

## API Endpoints

### Health Check
```bash
GET /health
```

### Get Model Info
```bash
GET /models/info
```

### Make Prediction
```bash
POST /predict
Content-Type: application/json

{
  "sport": "NFL",
  "homeTeam": "Kansas City Chiefs",
  "awayTeam": "Buffalo Bills",
  "dayOfWeek": 0,  # Monday
  "month": 11,
  "hour": 20,
  "openingSpread": -3.5,
  "closingSpread": -2.5,
  "openingTotal": 48.5,
  "closingTotal": 47.5,
  "openingML": -175,
  "closingML": -160,
  "confidence": 75.0
}
```

**Response:**
```json
{
  "winner_prediction": true,
  "winner_probability": 0.68,
  "spread_prediction": true,
  "spread_probability": 0.62,
  "confidence": 68.0,
  "model_version": "2025-11-11T06:00:00"
}
```

### Batch Predictions
```bash
POST /predict/batch
Content-Type: application/json

{
  "games": [...]  # Array of game objects
}
```

---

## Model Features

The XGBoost models use 20+ engineered features:

**Team & Game Context:**
- Sport (NFL/NCAAF encoded)
- Home/Away team (label encoded)
- Day of week, month, hour

**Odds Movement:**
- Opening spread/total/moneyline
- Closing spread/total/moneyline
- Spread movement (points & percentage)
- Total movement (points & percentage)
- ML movement

**Prediction Confidence:**
- Original confidence score
- High confidence flag (>70%)
- Medium confidence flag (50-70%)

**Future Features (with more data):**
- CLV (Closing Line Value)
- Beat-the-close indicators
- Historical team performance
- Weather conditions
- Injury reports

---

## Performance Monitoring

### Training Metrics

After training, check `ml-service/models/training_summary.json`:

```json
{
  "trained_at": "2025-11-11T06:00:00",
  "training_size": 250,
  "models": {
    "winner": {
      "accuracy": 0.58,
      "cv_accuracy": 0.565,
      "cv_std": 0.032
    },
    "spread": {
      "accuracy": 0.545
    }
  }
}
```

### Production Metrics

The FastAPI service tracks:
- Request count
- Average response time
- Model accuracy over time
- Feature importance

Access via `/metrics` endpoint.

---

## Model Comparison: Python vs TypeScript

| Aspect | Python XGBoost | TypeScript Ensemble |
|--------|----------------|---------------------|
| **Accuracy** | 56-60% (target) | 52-54% (baseline) |
| **Training Time** | 1-2 hours | Instant (pre-configured) |
| **Inference Speed** | ~50ms | ~5ms |
| **Model Updates** | Retrain weekly | Real-time learning |
| **Infrastructure** | Separate service ($5-10/mo) | Integrated (free) |
| **Feature Engineering** | Automated | Manual |
| **Best For** | High-stakes predictions | Real-time, high-volume |

### Recommendation

Use **both** models:
1. **Python XGBoost** for high-confidence predictions (>70%)
2. **TypeScript Ensemble** for quick predictions and experimentation
3. Compare and average when confidence is similar

---

## Troubleshooting

### Not Enough Training Data

```bash
[Train] Warning: Only 50 training examples available.
[Train] Recommend at least 100 games for reliable training.
```

**Solution:** Wait for Phase 2 odds collection to gather more data. Continue for 7-14 days.

### Models Not Loading

```bash
[Serve] Error: Models not found.
```

**Solution:** Train models first:
```bash
python ml-service/train_model.py
```

### Import Errors

```bash
ModuleNotFoundError: No module named 'xgboost'
```

**Solution:** Activate virtual environment:
```bash
source ml-service/venv/bin/activate
pip install -r ml-service/requirements.txt
```

---

## Next Steps

### Immediate (After Training)

1. **Test API locally**
   ```bash
   curl http://localhost:8000/health
   ```

2. **Compare with TypeScript models**
   - Run same game through both
   - Compare accuracy and confidence

3. **Deploy to production**
   - Railway or Fly.io
   - Update Next.js environment variables

### Week 1

1. **Collect more data** - Continue Phase 2 odds collection
2. **Retrain weekly** - As new games complete
3. **Monitor accuracy** - Track predictions vs outcomes

### Month 1

1. **Add advanced features**:
   - CLV metrics
   - Team-specific embeddings
   - Historical performance

2. **Hyperparameter tuning**:
   - Grid search for optimal XGBoost params
   - Feature selection

3. **Ensemble with TypeScript**:
   - Weighted average of both models
   - Confidence-based routing

---

## Cost Estimate

- **Railway/Fly.io hosting**: $5-10/month
- **Python environment**: Free (open source)
- **Training compute**: Local (free) or cloud ($0.50/training run)
- **API requests**: Unlimited (self-hosted)

**Total:** ~$10/month for production ML service

---

## Support

Questions? Check:
1. FastAPI docs: http://localhost:8000/docs
2. XGBoost docs: https://xgboost.readthedocs.io
3. Training logs: `ml-service/models/training_summary.json`

---

**Built with Claude Code - Phase 3.5: Python ML Integration**
