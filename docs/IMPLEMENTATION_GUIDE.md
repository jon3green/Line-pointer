# Line Pointer Sports - Advanced ML Implementation Guide

## 🚀 Quick Start: Building the Smartest Sports AI

This guide will walk you through implementing the most accurate, up-to-date ML platform step by step.

---

## Phase 1: Foundation (Week 1) - ✅ COMPLETED

### What We've Built:
1. ✅ Basic prediction tracking system
2. ✅ Automated result collection from ESPN
3. ✅ ML feedback loop with bias correction
4. ✅ Automated parlay generator (6 strategies)
5. ✅ Feature engineering framework (100+ features)
6. ✅ Ensemble model architecture (5 models)

### Current Accuracy: ~52-54% (Market baseline)
### Target Accuracy: 55-60% (Profitable)

---

## Phase 2: Data Enhancement (Week 2-3)

### Goal: Collect comprehensive, real-time data

### Step 1: Integrate Advanced Stats API

#### Option A: SportsRadar (Recommended)
**Cost:** $99-$499/month
**Features:**
- Real-time player stats
- Play-by-play data
- Advanced metrics (EPA, success rate, etc.)
- Injury reports
- Weather data

**Setup:**
```typescript
// lib/api/sportsradar.ts
const SPORTSRADAR_KEY = process.env.SPORTSRADAR_API_KEY;

export async function fetchAdvancedStats(teamId: string) {
  const response = await fetch(
    `https://api.sportsradar.us/nfl/official/trial/v7/en/teams/${teamId}/statistics.json?api_key=${SPORTSRADAR_KEY}`
  );
  return response.json();
}
```

#### Option B: Sportradar Alternative - Start with Free APIs
1. **ESPN API** - Already integrated
2. **The Odds API** - For line movement
3. **OpenWeather** - For weather
4. **Pro Football Reference** - Web scraping for historical data

### Step 2: Build Real-Time Data Pipeline

```typescript
// lib/data/pipeline.ts
import Bull from 'bull';
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);
const dataQueue = new Bull('data-collection', {
  redis: process.env.REDIS_URL,
});

// Schedule data collection every 5 minutes
dataQueue.add(
  'collect-odds',
  {},
  {
    repeat: { every: 300000 }, // 5 minutes
    removeOnComplete: true,
  }
);

// Process odds updates
dataQueue.process('collect-odds', async (job) => {
  const games = await fetchGames();

  for (const game of games) {
    // Fetch latest odds
    const odds = await fetchOdds(game.id);

    // Detect line movement
    const movement = detectLineMovement(game.id, odds);

    if (movement.isSignificant) {
      // Alert users to sharp money
      await createAlert({
        type: 'line_movement',
        game: game.id,
        movement,
      });
    }

    // Update cache
    await redis.set(`odds:${game.id}`, JSON.stringify(odds), 'EX', 300);
  }
});
```

### Step 3: Line Movement Tracking

```typescript
// lib/ml/line-movement.ts
export interface LineMovement {
  gameId: string;
  openingLine: number;
  currentLine: number;
  movement: number;
  movementPercent: number;
  direction: 'up' | 'down' | 'stable';
  isSignificant: boolean; // >2 point move
  isSteam: boolean; // Rapid movement (>1 pt in <5 min)
  isReverseLineMovement: boolean; // Line moves against public money
}

export function detectLineMovement(
  gameId: string,
  currentOdds: any,
  historicalOdds: any[]
): LineMovement {
  const opening = historicalOdds[0]?.spread || currentOdds.spread;
  const current = currentOdds.spread;
  const movement = current - opening;

  return {
    gameId,
    openingLine: opening,
    currentLine: current,
    movement,
    movementPercent: (movement / Math.abs(opening)) * 100,
    direction: movement > 0.5 ? 'up' : movement < -0.5 ? 'down' : 'stable',
    isSignificant: Math.abs(movement) > 2,
    isSteam: detectSteamMove(historicalOdds),
    isReverseLineMovement: detectRLM(movement, currentOdds.bettingPercent),
  };
}
```

---

## Phase 3: Advanced ML Models (Week 4-5)

### Step 1: Train XGBoost Model (Python)

```python
# models/xgboost_trainer.py
import xgboost as xgb
import pandas as pd
from sklearn.model_selection import train_test_split

# Load historical data
data = pd.read_sql("SELECT * FROM predictions WHERE actualWinner IS NOT NULL", conn)

# Feature engineering
X = data[[
    'homeOffensiveEfficiency', 'awayDefensiveEfficiency',
    'homeWinPercentageL5', 'eloDifference', 'currentSpread',
    'restDaysDifference', 'weatherImpactScore', 'isDivisionGame',
    # ... 92 more features
]]

y = (data['actualWinner'] == 'home').astype(int)

# Split data
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2)

# Train model
model = xgb.XGBClassifier(
    n_estimators=500,
    max_depth=6,
    learning_rate=0.01,
    subsample=0.8,
    colsample_bytree=0.8,
    objective='binary:logistic'
)

model.fit(X_train, y_train)

# Evaluate
accuracy = model.score(X_test, y_test)
print(f"Test Accuracy: {accuracy:.2%}")

# Save model
model.save_model('xgboost_nfl_v1.json')
```

### Step 2: Create Python ML Service

```python
# ml_service/app.py
from fastapi import FastAPI
from pydantic import BaseModel
import xgboost as xgb
import numpy as np

app = FastAPI()

# Load model
model = xgb.Booster()
model.load_model('xgboost_nfl_v1.json')

class PredictionRequest(BaseModel):
    features: dict

@app.post("/predict")
def predict(request: PredictionRequest):
    # Convert features to array
    X = np.array([list(request.features.values())])

    # Predict
    prob = model.predict(xgb.DMatrix(X))[0]

    return {
        "winProbability": float(prob),
        "winner": "home" if prob > 0.5 else "away",
        "confidence": int(abs(prob - 0.5) * 200)
    }

# Run: uvicorn app:app --host 0.0.0.0 --port 8000
```

### Step 3: Deploy ML Service

```dockerfile
# Dockerfile
FROM python:3.10-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000"]
```

```bash
# Deploy to Railway/Render/Fly.io
fly launch
fly deploy
```

### Step 4: Connect to ML Service

```typescript
// lib/ml/prediction-service.ts
const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000';

export async function predictWithXGBoost(features: MLFeatures): Promise<ModelPrediction> {
  const response = await fetch(`${ML_SERVICE_URL}/predict`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ features }),
  });

  const result = await response.json();

  return {
    modelName: 'XGBoost',
    winner: result.winner,
    confidence: result.confidence,
    spread: calculateSpreadFromProb(result.winProbability),
    total: 44, // Separate model for totals
    winProbability: result.winProbability,
    timestamp: new Date(),
  };
}
```

---

## Phase 4: Neural Network (Week 6) - Optional

### Train Deep Learning Model

```python
# models/neural_net.py
import tensorflow as tf
from tensorflow import keras

# Build model
model = keras.Sequential([
    keras.layers.Dense(256, activation='relu', input_shape=(100,)),
    keras.layers.Dropout(0.3),
    keras.layers.Dense(128, activation='relu'),
    keras.layers.BatchNormalization(),
    keras.layers.Dense(64, activation='relu'),
    keras.layers.Dense(1, activation='sigmoid')
])

model.compile(
    optimizer='adam',
    loss='binary_crossentropy',
    metrics=['accuracy']
)

# Train
history = model.fit(
    X_train, y_train,
    epochs=100,
    batch_size=32,
    validation_split=0.2,
    callbacks=[
        keras.callbacks.EarlyStopping(patience=10),
        keras.callbacks.ModelCheckpoint('best_model.h5')
    ]
)

# Target: 58-62% accuracy on test set
```

---

## Phase 5: Continuous Learning (Week 7)

### Auto-Retraining Pipeline

```typescript
// lib/ml/retraining.ts
import cron from 'node-cron';

// Retrain nightly at 3 AM
cron.schedule('0 3 * * *', async () => {
  console.log('Starting nightly model retraining...');

  // 1. Export data
  const data = await exportTrainingData();

  // 2. Trigger Python training job
  const response = await fetch(`${ML_SERVICE_URL}/retrain`, {
    method: 'POST',
    body: JSON.stringify(data),
  });

  const result = await response.json();

  // 3. Validate new model
  if (result.testAccuracy > currentModelAccuracy) {
    // Promote new model
    await promoteModel(result.modelId);
    console.log(`New model promoted: ${result.testAccuracy}%`);
  } else {
    console.log(`New model rejected: ${result.testAccuracy}% < ${currentModelAccuracy}%`);
  }
});
```

---

## Phase 6: Performance Monitoring (Week 8)

### Track Everything

```typescript
// lib/ml/monitoring.ts
import { prisma } from '../prisma';

export async function trackModelPerformance() {
  const last30Days = new Date();
  last30Days.setDate(last30Days.getDate() - 30);

  const predictions = await prisma.prediction.findMany({
    where: {
      createdAt: { gte: last30Days },
      wasCorrect: { not: null },
    },
  });

  // Calculate metrics
  const total = predictions.length;
  const correct = predictions.filter(p => p.wasCorrect).length;
  const accuracy = (correct / total) * 100;

  // By model (if tracked)
  const byModel = calculateByModel(predictions);

  // Alert if performance drops
  if (accuracy < 52) {
    await sendAlert({
      type: 'MODEL_PERFORMANCE_DEGRADED',
      accuracy,
      threshold: 52,
      message: 'Model accuracy has dropped below acceptable threshold',
    });
  }

  return {
    accuracy,
    total,
    correct,
    byModel,
  };
}

// Run every hour
setInterval(trackModelPerformance, 3600000);
```

---

## 🎯 Success Metrics

### Week-by-Week Targets:

**Week 1:** ✅ 52% (Baseline)
**Week 2:** 53% (Better data)
**Week 3:** 54% (Line movement)
**Week 4:** 55% (XGBoost)
**Week 5:** 56% (Ensemble)
**Week 6:** 57% (Neural Net)
**Week 7:** 58% (Continuous learning)
**Week 8:** 59-60% (Optimized)

### Long-Term Goals (3-6 months):
- **60%+ overall accuracy**
- **55%+ ATS accuracy** (profitable)
- **5%+ ROI** after vig
- **95%+ confidence calibration**
- **<200ms API response time**
- **99.9% uptime**

---

## 💡 Pro Tips

### 1. Start Simple, Add Complexity
Don't try to build everything at once. Start with:
1. Better data collection
2. Single XGBoost model
3. Then add ensemble
4. Then add neural nets

### 2. Focus on Data Quality
Bad data = bad model. Spend time on:
- Data validation
- Handling missing values
- Outlier detection
- Feature engineering

### 3. Monitor, Monitor, Monitor
Track everything:
- Model accuracy (overall, by sport, by bet type)
- Feature importance (which features matter)
- Prediction latency
- Data freshness

### 4. A/B Test Changes
Never deploy untested changes:
- Run new models in shadow mode
- Compare against current model
- Only promote if better

### 5. Keep It Simple Initially
You don't need:
- Complex neural networks (start with XGBoost)
- 100 features (start with 20 best ones)
- Real-time everything (daily updates are fine)

---

## 🚨 Common Pitfalls to Avoid

### 1. Overfitting
**Problem:** Model performs great on training data, terrible on new data
**Solution:** Use cross-validation, regularization, and hold-out test set

### 2. Data Leakage
**Problem:** Future information sneaks into training data
**Solution:** Strict time-based train/test splits

### 3. Ignoring Market Efficiency
**Problem:** Thinking you can easily beat the market
**Solution:** Combine ML with market signals, respect closing lines

### 4. Not Tracking Performance
**Problem:** Don't know if model is actually working
**Solution:** Track every prediction, calculate ongoing accuracy

### 5. Complexity for Complexity's Sake
**Problem:** Adding features/models that don't help
**Solution:** Measure impact of every addition

---

## 📊 Expected Results Timeline

### Month 1: Foundation
- Baseline: 52-53% accuracy
- Learning from past games
- Automated data collection
- Basic parlay generator

### Month 2: Enhanced Data
- 53-55% accuracy
- Real-time odds tracking
- Line movement detection
- 100+ features collected

### Month 3: ML Models
- 55-57% accuracy
- XGBoost trained and deployed
- Ensemble system working
- Continuous learning active

### Month 4-6: Optimization
- 57-60% accuracy
- Neural networks added
- Hyperparameter tuning
- Advanced strategies

### Year 1: Elite Performance
- **60%+ overall accuracy**
- Industry-leading performance
- Profitable betting system
- Scalable infrastructure

---

## 🎓 Learning Resources

### Courses:
1. **Fast.ai** - Practical Deep Learning (Free)
2. **Coursera** - Machine Learning by Andrew Ng (Free)
3. **Kaggle** - Competitions and tutorials

### Books:
1. "Hands-On Machine Learning" - Aurélien Géron
2. "The Signal and the Noise" - Nate Silver
3. "Mathletics" - Wayne Winston

### Communities:
1. r/sportsbook (Reddit)
2. Kaggle forums
3. Discord betting communities

---

## 🚀 Getting Started TODAY

### Immediate Next Steps:

1. **Sign up for The Odds API** (Free tier)
   - Get real-time odds
   - Track line movement
   - Cost: $0/month (500 requests)

2. **Export Historical Data**
   ```sql
   COPY (
     SELECT * FROM predictions
     WHERE actualWinner IS NOT NULL
   ) TO 'training_data.csv';
   ```

3. **Install Python ML Stack**
   ```bash
   pip install scikit-learn xgboost pandas numpy
   ```

4. **Train First Model** (This Weekend)
   - Use existing prediction data
   - Train simple XGBoost
   - Compare to current accuracy

5. **Deploy & Monitor**
   - Put model in production
   - Track performance daily
   - Iterate and improve

---

## 📈 ROI Calculation

### Conservative Estimate (55% ATS):
```
Daily: 10 bets × $100 = $1,000 wagered
Monthly: 300 bets × $100 = $30,000 wagered

Win rate: 55%
165 wins × $90.91 = $15,000
135 losses × $100 = $13,500
Monthly profit: $1,500

Annual profit: $18,000
Infrastructure cost: $10,000
NET PROFIT: $8,000
```

### Optimistic Estimate (60% ATS):
```
Monthly: 300 bets × $100 = $30,000 wagered

Win rate: 60%
180 wins × $90.91 = $16,364
120 losses × $100 = $12,000
Monthly profit: $4,364

Annual profit: $52,368
Infrastructure cost: $10,000
NET PROFIT: $42,368
```

---

## ✅ Current Status

**What's Live:**
- ✅ Prediction tracking with results
- ✅ ML feedback loop learning from mistakes
- ✅ Automated parlay generator (6 strategies)
- ✅ Feature engineering framework (100+ features ready)
- ✅ Ensemble architecture (5 models designed)
- ✅ Accuracy tracking dashboard
- ✅ High-confidence alerts
- ✅ ML insights widget

**What's Next:**
- ⏳ Integrate The Odds API for real-time odds
- ⏳ Train XGBoost model on historical data
- ⏳ Deploy Python ML service
- ⏳ Implement continuous retraining
- ⏳ Add line movement tracking

**Timeline to Elite Performance:** 3-6 months

---

Ready to build the smartest sports betting AI? Let's get started! 🚀
