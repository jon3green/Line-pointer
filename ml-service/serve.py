"""
FastAPI ML Prediction Service

Serves trained XGBoost models via REST API
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
import joblib
import pandas as pd
import numpy as np
from pathlib import Path
import json

app = FastAPI(title="Sports Prediction ML Service", version="1.0.0")

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Paths
MODELS_DIR = Path(__file__).parent / 'models'

# Global model cache
models = {}
encoders = {}

class GameInput(BaseModel):
    """Input features for prediction"""
    sport: str
    homeTeam: str
    awayTeam: str
    dayOfWeek: int
    month: int
    hour: int
    openingSpread: float
    closingSpread: float
    openingTotal: float
    closingTotal: float
    openingML: int
    closingML: int
    confidence: float

class PredictionOutput(BaseModel):
    """Prediction output"""
    winner_prediction: bool
    winner_probability: float
    spread_prediction: bool
    spread_probability: float
    confidence: float
    model_version: str

def load_models():
    """Load trained models on startup"""
    print("[Serve] Loading models...")

    try:
        models['winner'] = joblib.load(MODELS_DIR / 'winner_model.pkl')
        models['spread'] = joblib.load(MODELS_DIR / 'spread_model.pkl')
        encoders.update(joblib.load(MODELS_DIR / 'encoders.pkl'))

        # Load training summary
        with open(MODELS_DIR / 'training_summary.json', 'r') as f:
            models['summary'] = json.load(f)

        print(f"[Serve] Loaded models trained at: {models['summary']['trained_at']}")
        print(f"[Serve] Training size: {models['summary']['training_size']} games")

        return True
    except FileNotFoundError as e:
        print(f"[Serve] Error: Models not found. Run training first: python ml-service/train_model.py")
        print(f"[Serve] Missing: {e}")
        return False

@app.on_event("startup")
async def startup_event():
    """Load models when service starts"""
    if not load_models():
        print("[Serve] Warning: Starting without models. Train models first.")

@app.get("/")
async def root():
    """Health check"""
    return {
        "service": "Sports Prediction ML Service",
        "status": "running",
        "models_loaded": len(models) > 0,
    }

@app.get("/health")
async def health_check():
    """Detailed health check"""
    return {
        "status": "healthy",
        "models": {
            "winner": "winner" in models,
            "spread": "spread" in models,
        },
        "encoders": {
            "sport": "sport" in encoders,
            "home_team": "home_team" in encoders,
            "away_team": "away_team" in encoders,
        },
        "training_summary": models.get('summary', {}).get('trained_at', 'unknown'),
    }

@app.get("/models/info")
async def models_info():
    """Get model information"""
    if 'summary' not in models:
        raise HTTPException(status_code=503, detail="Models not loaded")

    return models['summary']

@app.post("/predict", response_model=PredictionOutput)
async def predict(game: GameInput):
    """Make prediction for a game"""
    if 'winner' not in models or 'spread' not in models:
        raise HTTPException(status_code=503, detail="Models not loaded. Train models first.")

    try:
        # Encode categorical variables
        sport_encoded = encoders['sport'].transform([game.sport])[0]

        # Handle unknown teams (use mean encoding)
        try:
            home_encoded = encoders['home_team'].transform([game.homeTeam])[0]
        except ValueError:
            home_encoded = len(encoders['home_team'].classes_) // 2

        try:
            away_encoded = encoders['away_team'].transform([game.awayTeam])[0]
        except ValueError:
            away_encoded = len(encoders['away_team'].classes_) // 2

        # Calculate derived features
        spread_movement = game.closingSpread - game.openingSpread
        spread_movement_pct = spread_movement / abs(game.openingSpread) if game.openingSpread != 0 else 0

        total_movement = game.closingTotal - game.openingTotal
        total_movement_pct = total_movement / game.openingTotal if game.openingTotal != 0 else 0

        ml_movement = game.closingML - game.openingML

        high_confidence = 1 if game.confidence > 70 else 0
        medium_confidence = 1 if 50 <= game.confidence <= 70 else 0

        # Build feature vectors (different models use different features)
        # Winner model uses all features
        winner_features = pd.DataFrame([{
            'sport_encoded': sport_encoded,
            'homeTeam_encoded': home_encoded,
            'awayTeam_encoded': away_encoded,
            'dayOfWeek': game.dayOfWeek,
            'month': game.month,
            'hour': game.hour,
            'openingSpread': game.openingSpread,
            'closingSpread': game.closingSpread,
            'spread_movement': spread_movement,
            'spread_movement_pct': spread_movement_pct,
            'openingTotal': game.openingTotal,
            'closingTotal': game.closingTotal,
            'total_movement': total_movement,
            'total_movement_pct': total_movement_pct,
            'openingML': game.openingML,
            'closingML': game.closingML,
            'ml_movement': ml_movement,
            'confidence': game.confidence,
            'high_confidence': high_confidence,
            'medium_confidence': medium_confidence,
        }])

        # Spread model uses fewer features
        spread_features = pd.DataFrame([{
            'sport_encoded': sport_encoded,
            'homeTeam_encoded': home_encoded,
            'awayTeam_encoded': away_encoded,
            'dayOfWeek': game.dayOfWeek,
            'month': game.month,
            'hour': game.hour,
            'openingSpread': game.openingSpread,
            'closingSpread': game.closingSpread,
            'spread_movement': spread_movement,
            'spread_movement_pct': spread_movement_pct,
            'openingTotal': game.openingTotal,
            'closingTotal': game.closingTotal,
            'openingML': game.openingML,
            'closingML': game.closingML,
            'confidence': game.confidence,
            'high_confidence': high_confidence,
        }])

        # Make predictions
        winner_pred = models['winner'].predict(winner_features)[0]
        winner_prob = models['winner'].predict_proba(winner_features)[0][1]

        spread_pred = models['spread'].predict(spread_features)[0]
        spread_prob = models['spread'].predict_proba(spread_features)[0][1]

        return PredictionOutput(
            winner_prediction=bool(winner_pred),
            winner_probability=float(winner_prob),
            spread_prediction=bool(spread_pred),
            spread_probability=float(spread_prob),
            confidence=float(max(winner_prob, 1 - winner_prob) * 100),
            model_version=models['summary']['trained_at'],
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction error: {str(e)}")

@app.post("/predict/batch")
async def predict_batch(games: List[GameInput]):
    """Make predictions for multiple games"""
    if 'winner' not in models or 'spread' not in models:
        raise HTTPException(status_code=503, detail="Models not loaded")

    predictions = []
    for game in games:
        try:
            pred = await predict(game)
            predictions.append(pred)
        except Exception as e:
            predictions.append({
                "error": str(e),
                "game": f"{game.awayTeam} @ {game.homeTeam}"
            })

    return {
        "predictions": predictions,
        "total": len(games),
        "successful": len([p for p in predictions if not isinstance(p, dict) or 'error' not in p]),
    }

@app.get("/metrics")
async def get_metrics():
    """Get model performance metrics"""
    if 'summary' not in models:
        raise HTTPException(status_code=503, detail="Models not loaded")

    return {
        "training_metrics": models['summary']['models'],
        "training_size": models['summary']['training_size'],
        "trained_at": models['summary']['trained_at'],
    }

if __name__ == '__main__':
    import uvicorn

    print("="*60)
    print("Starting Sports Prediction ML Service")
    print("="*60)
    print("API Documentation: http://localhost:8000/docs")
    print("Health Check: http://localhost:8000/health")
    print("="*60)

    uvicorn.run(app, host="0.0.0.0", port=8000)
