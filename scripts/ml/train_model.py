#!/usr/bin/env python3

"""
ML Model Training Pipeline for Sports Predictions

Features:
- Loads historical prediction data from database
- Trains ensemble of ML models (Random Forest, XGBoost, Logistic Regression)
- Uses 50+ features for prediction
- Saves trained models for inference
- Calculates feature importance
- Generates training metrics

Usage:
    python3 train_model.py --sport NFL --min-games 100
    python3 train_model.py --sport NCAAF --retrain
"""

import os
import sys
import json
import argparse
from datetime import datetime, timedelta
from typing import List, Dict, Tuple

import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, roc_auc_score
from sklearn.preprocessing import StandardScaler
import xgboost as xgb
import joblib

# Database connection (using environment variables)
import psycopg2
from dotenv import load_dotenv

load_dotenv()

# ===== CONFIGURATION =====
MODEL_DIR = "models"
DATA_DIR = "data/training"
MIN_TRAINING_SAMPLES = 100

# Feature categories
OFFENSIVE_FEATURES = [
    'homeOffensiveEff', 'awayOffensiveEff',
    'homePassingYards', 'awayPassingYards',
    'homeRushingYards', 'awayRushingYards',
    'homeRedZonePct', 'awayRedZonePct',
    'homeThirdDownPct', 'awayThirdDownPct',
]

DEFENSIVE_FEATURES = [
    'homeDefensiveEff', 'awayDefensiveEff',
    'homeSacksPerGame', 'awaySacksPerGame',
    'homeTurnoversForced', 'awayTurnoversForced',
]

SITUATIONAL_FEATURES = [
    'homeWinPct', 'awayWinPct',
    'homeATSRecord', 'awayATSRecord',
    'homeRestDays', 'awayRestDays',
    'isHomeTeam', 'isDivisionGame',
    'isConferenceGame', 'isPrimeTime',
]

ADVANCED_FEATURES = [
    'homeRecentForm', 'awayRecentForm',
    'h2hWinPct', 'homeHomeRecord', 'awayAwayRecord',
    'pointDifferential', 'totalPoints',
    'tempF', 'windMPH', 'precipitationProb',
]

ALL_FEATURES = (
    OFFENSIVE_FEATURES +
    DEFENSIVE_FEATURES +
    SITUATIONAL_FEATURES +
    ADVANCED_FEATURES
)

# ===== DATABASE CONNECTION =====

def get_db_connection():
    """Connect to PostgreSQL database"""
    return psycopg2.connect(
        host=os.getenv('DB_HOST', 'localhost'),
        database=os.getenv('DB_NAME', 'sports_predictions'),
        user=os.getenv('DB_USER', 'postgres'),
        password=os.getenv('DB_PASSWORD'),
        port=os.getenv('DB_PORT', '5432')
    )

# ===== DATA LOADING =====

def load_training_data(sport: str = None, min_date: datetime = None) -> pd.DataFrame:
    """Load historical predictions with results from database"""

    print(f"📥 Loading training data from database...")

    conn = get_db_connection()

    # Build query
    where_clauses = ["p.\"wasCorrect\" IS NOT NULL"]  # Only completed games

    if sport:
        where_clauses.append(f"p.sport = '{sport}'")

    if min_date:
        where_clauses.append(f"p.\"createdAt\" >= '{min_date.isoformat()}'")

    where_sql = " AND ".join(where_clauses)

    query = f"""
        SELECT
            p.id as prediction_id,
            p.sport,
            p."predictedWinner",
            p.confidence,
            p."wasCorrect",
            p."spreadCorrect",
            p."actualWinner",
            p."actualSpread",
            p."actualTotal",
            p."createdAt",

            -- Extract prediction factors from JSON
            p.factors as factors_json

        FROM "Prediction" p
        WHERE {where_sql}
        ORDER BY p."createdAt" DESC
    """

    df = pd.read_sql_query(query, conn)
    conn.close()

    print(f"✅ Loaded {len(df)} predictions")

    # Parse factors JSON into columns
    if 'factors_json' in df.columns:
        factors_df = pd.json_normalize(df['factors_json'].apply(json.loads))
        df = pd.concat([df.drop('factors_json', axis=1), factors_df], axis=1)

    return df

def prepare_features(df: pd.DataFrame) -> Tuple[pd.DataFrame, pd.Series]:
    """Prepare features and target variable"""

    print("🔧 Preparing features...")

    # Select available features
    available_features = [f for f in ALL_FEATURES if f in df.columns]

    if len(available_features) < 10:
        raise ValueError(f"Not enough features available. Found: {available_features}")

    print(f"  Using {len(available_features)} features")

    X = df[available_features].copy()
    y = df['wasCorrect'].astype(int)

    # Handle missing values
    X = X.fillna(X.mean())

    # Scale features
    scaler = StandardScaler()
    X_scaled = pd.DataFrame(
        scaler.fit_transform(X),
        columns=X.columns,
        index=X.index
    )

    return X_scaled, y, scaler, available_features

# ===== MODEL TRAINING =====

def train_ensemble(X_train, y_train, X_test, y_test) -> Dict:
    """Train ensemble of ML models"""

    print("\n🎯 Training ensemble models...")

    models = {}
    metrics = {}

    # 1. Random Forest
    print("  Training Random Forest...")
    rf_model = RandomForestClassifier(
        n_estimators=100,
        max_depth=10,
        min_samples_split=20,
        random_state=42,
        n_jobs=-1
    )
    rf_model.fit(X_train, y_train)
    rf_pred = rf_model.predict(X_test)
    rf_proba = rf_model.predict_proba(X_test)[:, 1]

    models['random_forest'] = rf_model
    metrics['random_forest'] = {
        'accuracy': accuracy_score(y_test, rf_pred),
        'precision': precision_score(y_test, rf_pred),
        'recall': recall_score(y_test, rf_pred),
        'f1': f1_score(y_test, rf_pred),
        'roc_auc': roc_auc_score(y_test, rf_proba),
    }

    # 2. XGBoost
    print("  Training XGBoost...")
    xgb_model = xgb.XGBClassifier(
        n_estimators=100,
        max_depth=6,
        learning_rate=0.1,
        random_state=42,
        eval_metric='logloss',
        use_label_encoder=False
    )
    xgb_model.fit(X_train, y_train)
    xgb_pred = xgb_model.predict(X_test)
    xgb_proba = xgb_model.predict_proba(X_test)[:, 1]

    models['xgboost'] = xgb_model
    metrics['xgboost'] = {
        'accuracy': accuracy_score(y_test, xgb_pred),
        'precision': precision_score(y_test, xgb_pred),
        'recall': recall_score(y_test, xgb_pred),
        'f1': f1_score(y_test, xgb_pred),
        'roc_auc': roc_auc_score(y_test, xgb_proba),
    }

    # 3. Logistic Regression (baseline)
    print("  Training Logistic Regression...")
    lr_model = LogisticRegression(
        max_iter=1000,
        random_state=42
    )
    lr_model.fit(X_train, y_train)
    lr_pred = lr_model.predict(X_test)
    lr_proba = lr_model.predict_proba(X_test)[:, 1]

    models['logistic_regression'] = lr_model
    metrics['logistic_regression'] = {
        'accuracy': accuracy_score(y_test, lr_pred),
        'precision': precision_score(y_test, lr_pred),
        'recall': recall_score(y_test, lr_pred),
        'f1': f1_score(y_test, lr_pred),
        'roc_auc': roc_auc_score(y_test, lr_proba),
    }

    # 4. Ensemble (weighted average)
    print("  Creating ensemble...")
    ensemble_weights = {
        'random_forest': 0.35,
        'xgboost': 0.40,
        'logistic_regression': 0.25,
    }

    ensemble_proba = (
        ensemble_weights['random_forest'] * rf_proba +
        ensemble_weights['xgboost'] * xgb_proba +
        ensemble_weights['logistic_regression'] * lr_proba
    )
    ensemble_pred = (ensemble_proba >= 0.5).astype(int)

    metrics['ensemble'] = {
        'accuracy': accuracy_score(y_test, ensemble_pred),
        'precision': precision_score(y_test, ensemble_pred),
        'recall': recall_score(y_test, ensemble_pred),
        'f1': f1_score(y_test, ensemble_pred),
        'roc_auc': roc_auc_score(y_test, ensemble_proba),
        'weights': ensemble_weights,
    }

    return models, metrics

def calculate_feature_importance(models: Dict, feature_names: List[str]) -> Dict:
    """Calculate feature importance from trained models"""

    print("\n📊 Calculating feature importance...")

    importance = {}

    # Random Forest importance
    rf_importance = models['random_forest'].feature_importances_
    importance['random_forest'] = dict(zip(feature_names, rf_importance))

    # XGBoost importance
    xgb_importance = models['xgboost'].feature_importances_
    importance['xgboost'] = dict(zip(feature_names, xgb_importance))

    # Average importance
    avg_importance = {
        feature: (importance['random_forest'][feature] + importance['xgboost'][feature]) / 2
        for feature in feature_names
    }
    importance['average'] = avg_importance

    # Sort by importance
    top_features = sorted(avg_importance.items(), key=lambda x: x[1], reverse=True)[:10]

    print("\n  Top 10 Most Important Features:")
    for i, (feature, imp) in enumerate(top_features, 1):
        print(f"    {i}. {feature}: {imp:.4f}")

    return importance

# ===== SAVE MODELS =====

def save_models(models: Dict, scaler, feature_names: List[str], metrics: Dict, sport: str):
    """Save trained models and metadata"""

    print(f"\n💾 Saving models to {MODEL_DIR}/...")

    os.makedirs(MODEL_DIR, exist_ok=True)

    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    model_version = f"v{timestamp}"

    # Save each model
    for model_name, model in models.items():
        filename = f"{MODEL_DIR}/{sport}_{model_name}_{model_version}.joblib"
        joblib.dump(model, filename)
        print(f"  ✓ Saved {filename}")

    # Save scaler
    scaler_filename = f"{MODEL_DIR}/{sport}_scaler_{model_version}.joblib"
    joblib.dump(scaler, scaler_filename)
    print(f"  ✓ Saved {scaler_filename}")

    # Save metadata
    metadata = {
        'sport': sport,
        'model_version': model_version,
        'trained_at': datetime.now().isoformat(),
        'feature_names': feature_names,
        'metrics': metrics,
        'model_files': {
            model_name: f"{sport}_{model_name}_{model_version}.joblib"
            for model_name in models.keys()
        },
        'scaler_file': f"{sport}_scaler_{model_version}.joblib",
    }

    metadata_filename = f"{MODEL_DIR}/{sport}_metadata_{model_version}.json"
    with open(metadata_filename, 'w') as f:
        json.dump(metadata, f, indent=2, default=str)
    print(f"  ✓ Saved {metadata_filename}")

    # Save as "latest" for easy loading
    latest_meta = f"{MODEL_DIR}/{sport}_latest.json"
    with open(latest_meta, 'w') as f:
        json.dump(metadata, f, indent=2, default=str)
    print(f"  ✓ Saved {latest_meta}")

    return model_version

# ===== MAIN =====

def main():
    parser = argparse.ArgumentParser(description='Train ML models for sports predictions')
    parser.add_argument('--sport', type=str, default='NFL', help='Sport to train for (NFL, NCAAF)')
    parser.add_argument('--min-games', type=int, default=100, help='Minimum number of games for training')
    parser.add_argument('--retrain', action='store_true', help='Retrain existing model')
    parser.add_argument('--days-back', type=int, default=730, help='Days of historical data to use')

    args = parser.parse_args()

    print("🏈 ML Model Training Pipeline")
    print("=" * 50)
    print(f"Sport: {args.sport}")
    print(f"Minimum games: {args.min_games}")
    print(f"Historical window: {args.days_back} days")
    print()

    # Load data
    min_date = datetime.now() - timedelta(days=args.days_back)
    df = load_training_data(sport=args.sport, min_date=min_date)

    if len(df) < args.min_games:
        print(f"❌ Not enough training data. Found {len(df)} games, need {args.min_games}")
        sys.exit(1)

    # Prepare features
    X, y, scaler, feature_names = prepare_features(df)

    # Split data
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    print(f"\n📊 Dataset split:")
    print(f"  Training: {len(X_train)} games")
    print(f"  Testing: {len(X_test)} games")
    print(f"  Positive class: {y_train.sum()} ({y_train.mean()*100:.1f}%)")

    # Train models
    models, metrics = train_ensemble(X_train, y_train, X_test, y_test)

    # Calculate feature importance
    importance = calculate_feature_importance(models, feature_names)

    # Print metrics
    print("\n📈 Model Performance:")
    print("=" * 50)
    for model_name, model_metrics in metrics.items():
        print(f"\n{model_name.upper()}:")
        print(f"  Accuracy:  {model_metrics['accuracy']:.3f}")
        print(f"  Precision: {model_metrics['precision']:.3f}")
        print(f"  Recall:    {model_metrics['recall']:.3f}")
        print(f"  F1 Score:  {model_metrics['f1']:.3f}")
        print(f"  ROC AUC:   {model_metrics['roc_auc']:.3f}")

    # Save models
    model_version = save_models(models, scaler, feature_names, metrics, args.sport)

    print(f"\n✅ Training complete!")
    print(f"   Model version: {model_version}")
    print(f"   Best model: {max(metrics.items(), key=lambda x: x[1]['accuracy'])[0]}")
    print(f"   Best accuracy: {max(m['accuracy'] for m in metrics.values()):.3f}")
    print()

if __name__ == '__main__':
    main()
