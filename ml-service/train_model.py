"""
Train XGBoost Model for Sports Predictions

This script trains an XGBoost model on historical game data
to predict game outcomes, spreads, and totals.
"""

import pandas as pd
import numpy as np
from xgboost import XGBClassifier, XGBRegressor
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.metrics import accuracy_score, classification_report, mean_absolute_error
from sklearn.preprocessing import LabelEncoder
import joblib
import json
from pathlib import Path
from datetime import datetime

# Paths
DATA_DIR = Path(__file__).parent / 'data'
MODELS_DIR = Path(__file__).parent / 'models'
MODELS_DIR.mkdir(exist_ok=True)

def load_training_data():
    """Load and preprocess training data"""
    print("[Train] Loading training data...")

    data_path = DATA_DIR / 'training_data.csv'
    if not data_path.exists():
        raise FileNotFoundError(
            f"Training data not found at {data_path}. "
            "Run: npm run export-training-data first."
        )

    df = pd.read_csv(data_path)
    print(f"[Train] Loaded {len(df)} training examples")

    # Basic data info
    print(f"[Train] Sports: {df['sport'].value_counts().to_dict()}")
    print(f"[Train] Date range: {df['gameTime'].min()} to {df['gameTime'].max()}")

    return df

def engineer_features(df):
    """Create features for ML model"""
    print("[Train] Engineering features...")

    # Encode categorical variables
    sport_encoder = LabelEncoder()
    df['sport_encoded'] = sport_encoder.fit_transform(df['sport'])

    # Encode teams (could be improved with team embeddings)
    home_encoder = LabelEncoder()
    away_encoder = LabelEncoder()

    all_teams = pd.concat([df['homeTeam'], df['awayTeam']]).unique()
    home_encoder.fit(all_teams)
    away_encoder.fit(all_teams)

    df['homeTeam_encoded'] = home_encoder.transform(df['homeTeam'])
    df['awayTeam_encoded'] = away_encoder.transform(df['awayTeam'])

    # Parse date features
    df['gameTime'] = pd.to_datetime(df['gameTime'])
    df['dayOfWeek'] = df['gameTime'].dt.dayofweek
    df['month'] = df['gameTime'].dt.month
    df['hour'] = df['gameTime'].dt.hour

    # Spread features
    df['spread_movement'] = df['closingSpread'] - df['openingSpread']
    df['spread_movement_pct'] = df['spread_movement'] / df['openingSpread'].abs().replace(0, 1)

    # Total features
    df['total_movement'] = df['closingTotal'] - df['openingTotal']
    df['total_movement_pct'] = df['total_movement'] / df['openingTotal'].replace(0, 1)

    # ML features
    df['ml_movement'] = df['closingML'] - df['openingML']

    # Confidence features
    df['high_confidence'] = (df['confidence'] > 70).astype(int)
    df['medium_confidence'] = ((df['confidence'] >= 50) & (df['confidence'] <= 70)).astype(int)

    # Fill NaNs
    df = df.fillna(0)

    # Save encoders
    encoders = {
        'sport': sport_encoder,
        'home_team': home_encoder,
        'away_team': away_encoder,
    }

    joblib.dump(encoders, MODELS_DIR / 'encoders.pkl')
    print(f"[Train] Saved encoders to {MODELS_DIR / 'encoders.pkl'}")

    return df

def train_winner_model(df):
    """Train model to predict winner (classification)"""
    print("\n[Train] Training winner prediction model...")

    # Features
    feature_cols = [
        'sport_encoded', 'homeTeam_encoded', 'awayTeam_encoded',
        'dayOfWeek', 'month', 'hour',
        'openingSpread', 'closingSpread', 'spread_movement', 'spread_movement_pct',
        'openingTotal', 'closingTotal', 'total_movement', 'total_movement_pct',
        'openingML', 'closingML', 'ml_movement',
        'confidence', 'high_confidence', 'medium_confidence',
    ]

    # Filter to rows with actual results
    df_complete = df[df['wasCorrect'].notna()].copy()

    X = df_complete[feature_cols]
    y = df_complete['wasCorrect'].astype(int)

    # Train/test split
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    print(f"[Train] Training set: {len(X_train)}, Test set: {len(X_test)}")

    # Train XGBoost
    model = XGBClassifier(
        n_estimators=100,
        max_depth=6,
        learning_rate=0.1,
        objective='binary:logistic',
        eval_metric='logloss',
        random_state=42,
        n_jobs=-1
    )

    model.fit(
        X_train, y_train,
        eval_set=[(X_test, y_test)],
        verbose=False
    )

    # Evaluate
    y_pred = model.predict(X_test)
    y_prob = model.predict_proba(X_test)[:, 1]

    accuracy = accuracy_score(y_test, y_pred)
    print(f"[Train] Winner Model Accuracy: {accuracy:.4f} ({accuracy * 100:.2f}%)")
    print(classification_report(y_test, y_pred))

    # Cross-validation
    cv_scores = cross_val_score(model, X, y, cv=5, scoring='accuracy')
    print(f"[Train] Cross-validation accuracy: {cv_scores.mean():.4f} (+/- {cv_scores.std():.4f})")

    # Feature importance
    feature_importance = pd.DataFrame({
        'feature': feature_cols,
        'importance': model.feature_importances_
    }).sort_values('importance', ascending=False)

    print("\n[Train] Top 10 Features:")
    print(feature_importance.head(10))

    # Save model
    model_path = MODELS_DIR / 'winner_model.pkl'
    joblib.dump(model, model_path)
    print(f"[Train] Saved model to {model_path}")

    return {
        'accuracy': float(accuracy),
        'cv_accuracy': float(cv_scores.mean()),
        'cv_std': float(cv_scores.std()),
        'feature_importance': feature_importance.to_dict('records'),
    }

def train_spread_model(df):
    """Train model to predict if bet beats the spread (classification)"""
    print("\n[Train] Training spread prediction model...")

    feature_cols = [
        'sport_encoded', 'homeTeam_encoded', 'awayTeam_encoded',
        'dayOfWeek', 'month', 'hour',
        'openingSpread', 'closingSpread', 'spread_movement', 'spread_movement_pct',
        'openingTotal', 'closingTotal',
        'openingML', 'closingML',
        'confidence', 'high_confidence',
    ]

    df_complete = df[df['spreadCorrect'].notna()].copy()

    X = df_complete[feature_cols]
    y = df_complete['spreadCorrect'].astype(int)

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    model = XGBClassifier(
        n_estimators=100,
        max_depth=5,
        learning_rate=0.1,
        objective='binary:logistic',
        random_state=42,
        n_jobs=-1
    )

    model.fit(X_train, y_train, eval_set=[(X_test, y_test)], verbose=False)

    y_pred = model.predict(X_test)
    accuracy = accuracy_score(y_test, y_pred)

    print(f"[Train] Spread Model Accuracy: {accuracy:.4f} ({accuracy * 100:.2f}%)")

    model_path = MODELS_DIR / 'spread_model.pkl'
    joblib.dump(model, model_path)
    print(f"[Train] Saved model to {model_path}")

    return {'accuracy': float(accuracy)}

def main():
    """Main training pipeline"""
    print("="*60)
    print("Sports Prediction Model Training")
    print("="*60)

    # Load data
    df = load_training_data()

    if len(df) < 100:
        print(f"\n[Train] Warning: Only {len(df)} training examples available.")
        print("[Train] Recommend at least 100 games for reliable training.")
        print("[Train] Continue collecting data from Phase 2 odds system.")
        return

    # Engineer features
    df = engineer_features(df)

    # Train models
    winner_metrics = train_winner_model(df)
    spread_metrics = train_spread_model(df)

    # Save training summary
    summary = {
        'trained_at': datetime.now().isoformat(),
        'training_size': len(df),
        'models': {
            'winner': winner_metrics,
            'spread': spread_metrics,
        },
        'data_summary': {
            'sports': df['sport'].value_counts().to_dict(),
            'date_range': {
                'start': str(df['gameTime'].min()),
                'end': str(df['gameTime'].max()),
            },
        },
    }

    summary_path = MODELS_DIR / 'training_summary.json'
    with open(summary_path, 'w') as f:
        json.dump(summary, f, indent=2)

    print("\n" + "="*60)
    print("Training Complete!")
    print("="*60)
    print(f"Models saved to: {MODELS_DIR}")
    print(f"Training summary: {summary_path}")
    print("\nNext steps:")
    print("1. Review model performance metrics")
    print("2. Deploy ML service: python ml-service/serve.py")
    print("3. Compare with TypeScript models")

if __name__ == '__main__':
    main()
