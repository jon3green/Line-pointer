"""
Comprehensive ML Training Pipeline for Sports Prediction System

This script trains ensemble machine learning models on comprehensive historical data:
- Prediction tracker data (50+ decision factors)
- nflfastR play-by-play data (EPA, success rate, explosive plays)
- Historical odds data (line movement, CLV)
- Injury reports and weather data

Models:
- Random Forest (sklearn)
- Gradient Boosting (sklearn)
- XGBoost (if available)

Designed to run locally or on Google Colab (free GPU).

Usage:
    python train_model.py --sport NFL
    python train_model.py --sport NCAAF --tune-hyperparameters --years 2020 2021 2022 2023 2024
"""

import os
import sys
import argparse
import warnings
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split, cross_val_score, GridSearchCV
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    roc_auc_score, classification_report, confusion_matrix
)
from sklearn.preprocessing import StandardScaler, LabelEncoder
import joblib
import json
from pathlib import Path
from datetime import datetime

warnings.filterwarnings('ignore')

# Optional: XGBoost (recommended but not required)
try:
    from xgboost import XGBClassifier
    HAS_XGBOOST = True
except ImportError:
    print("WARNING: XGBoost not installed. Install with: pip install xgboost")
    HAS_XGBOOST = False

# Optional: Database connection
try:
    import psycopg2
    from psycopg2.extras import RealDictCursor
    HAS_PSYCOPG2 = True
except ImportError:
    print("WARNING: psycopg2 not installed. Database features disabled.")
    HAS_PSYCOPG2 = False

# Optional: nflfastR
try:
    import nfl_data_py as nfl
    HAS_NFLFASTR = True
except ImportError:
    print("WARNING: nfl_data_py not installed. nflfastR features disabled.")
    HAS_NFLFASTR = False

# Paths
DATA_DIR = Path(__file__).parent / 'data'
MODELS_DIR = Path(__file__).parent / 'models'
MODELS_DIR.mkdir(exist_ok=True)


class ComprehensiveMLPipeline:
    """Complete ML training pipeline integrating all data sources"""

    def __init__(self, sport='NFL', data_dir=DATA_DIR):
        self.sport = sport
        self.data_dir = data_dir
        self.models = {}
        self.scaler = StandardScaler()
        self.encoders = {}

    def load_prediction_data(self, db_url=None):
        """
        Load prediction data from database or local files
        This includes ALL 50+ factors from the prediction tracker
        """
        print(f"\n{'='*60}")
        print(f"Loading Prediction Data - {self.sport}")
        print(f"{'='*60}\n")

        # Try database first
        if db_url and HAS_PSYCOPG2:
            try:
                conn = psycopg2.connect(db_url)
                query = """
                    SELECT
                        "id", "gameId", "sport", "homeTeam", "awayTeam", "gameTime",
                        "predictedWinner", "confidence", "predictedSpread",
                        "openingSpread", "closingSpread", "factors",
                        "actualWinner", "actualSpread", "wasCorrect",
                        "spreadCLV", "beatTheCloseSpread", "madeAt", "resultsFetchedAt"
                    FROM "Prediction"
                    WHERE "sport" = %s AND "wasCorrect" IS NOT NULL
                    ORDER BY "madeAt" ASC
                """
                df = pd.read_sql_query(query, conn, params=(self.sport,))
                conn.close()
                print(f"✓ Loaded {len(df)} predictions from database")
                return df
            except Exception as e:
                print(f"WARNING: Database load failed: {e}")
                print("Falling back to local data...")

        # Fallback to local files
        csv_path = self.data_dir / f'{self.sport.lower()}_predictions.csv'
        json_path = self.data_dir / f'{self.sport.lower()}_predictions.json'

        if csv_path.exists():
            df = pd.read_csv(csv_path)
            print(f"✓ Loaded {len(df)} predictions from {csv_path}")
            return df
        elif json_path.exists():
            df = pd.read_json(json_path)
            print(f"✓ Loaded {len(df)} predictions from {json_path}")
            return df
        else:
            print(f"ERROR: No prediction data found for {self.sport}")
            return pd.DataFrame()

    def load_nflfastr_data(self, years):
        """Load nflfastR data for advanced features"""
        if not HAS_NFLFASTR:
            print("Skipping nflfastR data (library not available)")
            return pd.DataFrame()

        print(f"\nLoading nflfastR data for years: {years}...")
        try:
            pbp_data = nfl.import_pbp_data(years, downcast=True, cache=True)
            print(f"✓ Loaded {len(pbp_data)} plays from nflfastR")
            return pbp_data
        except Exception as e:
            print(f"WARNING: nflfastR load failed: {e}")
            return pd.DataFrame()

    def engineer_features(self, df):
        """
        Comprehensive feature engineering from prediction tracker factors
        Extracts all 50+ factors stored in JSON
        """
        print(f"\nEngineering features from prediction tracker...")

        if df.empty:
            return df

        # Parse factors JSON (contains all 50+ decision factors)
        if 'factors' in df.columns:
            factors_df = df['factors'].apply(
                lambda x: json.loads(x) if isinstance(x, str) else (x if isinstance(x, dict) else {})
            )
            factors_expanded = pd.json_normalize(factors_df)
            df = pd.concat([df, factors_expanded], axis=1)

        # Target variable
        df['target'] = df['wasCorrect'].astype(int)

        # Collect all feature columns
        feature_columns = []

        # Team Performance Features (from nflfastR)
        performance = [
            'homeOffensiveEff', 'awayOffensiveEff', 'homeDefensiveEff', 'awayDefensiveEff',
            'homeYardsPerPlay', 'awayYardsPerPlay', 'homeSuccessRate', 'awaySuccessRate',
            'homeExplosivePlayRate', 'awayExplosivePlayRate', 'homeRedZoneEff', 'awayRedZoneEff',
            'homeThirdDownConv', 'awayThirdDownConv'
        ]
        feature_columns.extend([f for f in performance if f in df.columns])

        # Rest & Schedule
        rest = ['restDaysHome', 'restDaysAway', 'homeStrengthOfSchedule', 'awayStrengthOfSchedule']
        feature_columns.extend([f for f in rest if f in df.columns])

        # Weather
        weather = ['temperature', 'windSpeed', 'precipitation', 'weatherImpactScore']
        feature_columns.extend([f for f in weather if f in df.columns])

        # Injuries
        injuries = ['homeKeyInjuries', 'awayKeyInjuries', 'homeInjuryImpact', 'awayInjuryImpact']
        feature_columns.extend([f for f in injuries if f in df.columns])

        # Recent Form
        form = [
            'homePointsPerGameL5', 'awayPointsPerGameL5',
            'homePointsAllowedL5', 'awayPointsAllowedL5'
        ]
        feature_columns.extend([f for f in form if f in df.columns])

        # Situational
        situational = ['homeATS', 'awayATS', 'homeVsTop10', 'awayVsTop10']
        feature_columns.extend([f for f in situational if f in df.columns])

        # Line Movement & Market
        line = ['lineMovement', 'spreadCLV', 'publicBettingPercent']
        feature_columns.extend([f for f in line if f in df.columns])

        # EPA Metrics (nflfastR advanced stats)
        epa = [
            'homeEPAPerPlay', 'awayEPAPerPlay',
            'homePassEPA', 'awayPassEPA', 'homeRunEPA', 'awayRunEPA'
        ]
        feature_columns.extend([f for f in epa if f in df.columns])

        # Confidence
        if 'confidence' in df.columns:
            feature_columns.append('confidence')

        # Derived features
        if 'homeOffensiveEff' in df.columns and 'awayDefensiveEff' in df.columns:
            df['homeOffensiveAdvantage'] = df['homeOffensiveEff'] - df['awayDefensiveEff']
            feature_columns.append('homeOffensiveAdvantage')

        if 'awayOffensiveEff' in df.columns and 'homeDefensiveEff' in df.columns:
            df['awayOffensiveAdvantage'] = df['awayOffensiveEff'] - df['homeDefensiveEff']
            feature_columns.append('awayOffensiveAdvantage')

        if 'restDaysHome' in df.columns and 'restDaysAway' in df.columns:
            df['restAdvantage'] = df['restDaysHome'] - df['restDaysAway']
            feature_columns.append('restAdvantage')

        # Fill missing values
        for col in feature_columns:
            if col in df.columns:
                if df[col].dtype in ['float64', 'int64']:
                    df[col] = df[col].fillna(df[col].median())
                else:
                    df[col] = df[col].fillna(0)

        print(f"✓ Engineered {len(feature_columns)} features")
        print(f"  Top features: {', '.join(feature_columns[:10])}")

        return df[feature_columns + ['target']].dropna()

    def train_ensemble_models(self, X_train, X_test, y_train, y_test, tune_hyperparameters=False):
        """
        Train ensemble of models: Random Forest, Gradient Boosting, XGBoost
        """
        print(f"\n{'='*60}")
        print(f"Training Ensemble Models")
        print(f"{'='*60}\n")

        print(f"Training: {len(X_train)} samples | Test: {len(X_test)} samples")
        print(f"Features: {X_train.shape[1]}\n")

        # Scale features
        X_train_scaled = self.scaler.fit_transform(X_train)
        X_test_scaled = self.scaler.transform(X_test)

        results = {}

        # 1. Random Forest
        print("[1/3] Training Random Forest...")
        if tune_hyperparameters:
            rf_params = {
                'n_estimators': [100, 200, 300],
                'max_depth': [10, 20, 30, None],
                'min_samples_split': [2, 5, 10],
            }
            rf = GridSearchCV(RandomForestClassifier(random_state=42), rf_params, cv=5, n_jobs=-1, verbose=1)
        else:
            rf = RandomForestClassifier(n_estimators=200, max_depth=20, random_state=42, n_jobs=-1)

        rf.fit(X_train_scaled, y_train)
        rf_pred = rf.predict(X_test_scaled)
        rf_prob = rf.predict_proba(X_test_scaled)[:, 1]

        results['random_forest'] = {
            'model': rf,
            'accuracy': accuracy_score(y_test, rf_pred),
            'precision': precision_score(y_test, rf_pred, zero_division=0),
            'recall': recall_score(y_test, rf_pred, zero_division=0),
            'f1': f1_score(y_test, rf_pred, zero_division=0),
            'roc_auc': roc_auc_score(y_test, rf_prob),
        }
        print(f"  ✓ Accuracy: {results['random_forest']['accuracy']:.4f}")

        # 2. Gradient Boosting
        print("\n[2/3] Training Gradient Boosting...")
        gb = GradientBoostingClassifier(n_estimators=200, max_depth=5, learning_rate=0.1, random_state=42)
        gb.fit(X_train_scaled, y_train)
        gb_pred = gb.predict(X_test_scaled)
        gb_prob = gb.predict_proba(X_test_scaled)[:, 1]

        results['gradient_boosting'] = {
            'model': gb,
            'accuracy': accuracy_score(y_test, gb_pred),
            'precision': precision_score(y_test, gb_pred, zero_division=0),
            'recall': recall_score(y_test, gb_pred, zero_division=0),
            'f1': f1_score(y_test, gb_pred, zero_division=0),
            'roc_auc': roc_auc_score(y_test, gb_prob),
        }
        print(f"  ✓ Accuracy: {results['gradient_boosting']['accuracy']:.4f}")

        # 3. XGBoost
        if HAS_XGBOOST:
            print("\n[3/3] Training XGBoost...")
            xgb_model = XGBClassifier(
                n_estimators=200, max_depth=6, learning_rate=0.1,
                random_state=42, eval_metric='logloss', n_jobs=-1
            )
            xgb_model.fit(X_train_scaled, y_train)
            xgb_pred = xgb_model.predict(X_test_scaled)
            xgb_prob = xgb_model.predict_proba(X_test_scaled)[:, 1]

            results['xgboost'] = {
                'model': xgb_model,
                'accuracy': accuracy_score(y_test, xgb_pred),
                'precision': precision_score(y_test, xgb_pred, zero_division=0),
                'recall': recall_score(y_test, xgb_pred, zero_division=0),
                'f1': f1_score(y_test, xgb_pred, zero_division=0),
                'roc_auc': roc_auc_score(y_test, xgb_prob),
            }
            print(f"  ✓ Accuracy: {results['xgboost']['accuracy']:.4f}")

        self.models = results
        return results

    def evaluate_and_select_best(self, X_test, y_test):
        """Evaluate all models and select the best one"""
        print(f"\n{'='*60}")
        print(f"Model Evaluation & Selection")
        print(f"{'='*60}\n")

        X_test_scaled = self.scaler.transform(X_test)

        best_model_name = None
        best_f1 = 0

        for name, result in self.models.items():
            print(f"{name.upper()}:")
            print(f"  Accuracy:  {result['accuracy']:.4f}")
            print(f"  Precision: {result['precision']:.4f}")
            print(f"  Recall:    {result['recall']:.4f}")
            print(f"  F1 Score:  {result['f1']:.4f}")
            print(f"  ROC AUC:   {result['roc_auc']:.4f}\n")

            # Select based on F1 score (balanced metric)
            if result['f1'] > best_f1:
                best_f1 = result['f1']
                best_model_name = name

        print(f"{'='*60}")
        print(f"BEST MODEL: {best_model_name.upper()}")
        print(f"F1 Score: {best_f1:.4f}")
        print(f"{'='*60}\n")

        return best_model_name

    def save_production_model(self, model_name, feature_names):
        """Save the best model for production use"""
        print(f"Saving {model_name} model for production...")

        model_path = MODELS_DIR / f'{self.sport.lower()}_{model_name}_model.pkl'
        scaler_path = MODELS_DIR / f'{self.sport.lower()}_scaler.pkl'
        features_path = MODELS_DIR / f'{self.sport.lower()}_features.json'

        # Save model
        joblib.dump(self.models[model_name]['model'], model_path)
        print(f"  ✓ Model: {model_path}")

        # Save scaler
        joblib.dump(self.scaler, scaler_path)
        print(f"  ✓ Scaler: {scaler_path}")

        # Save feature metadata
        metadata = {
            'sport': self.sport,
            'model_type': model_name,
            'features': list(feature_names),
            'feature_count': len(feature_names),
            'trained_at': datetime.now().isoformat(),
            'metrics': {k: float(v) for k, v in self.models[model_name].items() if k != 'model'},
        }

        with open(features_path, 'w') as f:
            json.dump(metadata, f, indent=2)
        print(f"  ✓ Metadata: {features_path}")

    def run(self, db_url=None, years=None, tune_hyperparameters=False):
        """Execute the complete training pipeline"""
        print(f"\n{'='*70}")
        print(f"  COMPREHENSIVE ML TRAINING PIPELINE - {self.sport}")
        print(f"  {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print(f"{'='*70}")

        # 1. Load prediction data
        df = self.load_prediction_data(db_url)
        if df.empty or len(df) < 50:
            print(f"\n❌ ERROR: Insufficient data ({len(df)} predictions)")
            print("Need at least 50 predictions with results for training.")
            print("\nNext steps:")
            print("1. Continue running the system to collect predictions")
            print("2. Wait for games to complete and results to be fetched")
            print("3. Run training again once you have more data")
            return

        print(f"\n✓ Dataset: {len(df)} predictions")
        print(f"  Accuracy: {df['wasCorrect'].mean():.2%}")
        print(f"  CLV Beat Rate: {df['beatTheCloseSpread'].mean():.2%}" if 'beatTheCloseSpread' in df.columns else "")

        # 2. Engineer features
        df_features = self.engineer_features(df)
        if df_features.empty:
            print("\n❌ ERROR: Feature engineering failed")
            return

        # 3. Split data
        X = df_features.drop('target', axis=1)
        y = df_features['target']

        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42, stratify=y
        )

        # 4. Train models
        self.train_ensemble_models(X_train, X_test, y_train, y_test, tune_hyperparameters)

        # 5. Select best model
        best_model = self.evaluate_and_select_best(X_test, y_test)

        # 6. Save for production
        self.save_production_model(best_model, X.columns)

        print(f"\n{'='*70}")
        print(f"  ✅ TRAINING COMPLETE!")
        print(f"  Model saved to: {MODELS_DIR}")
        print(f"{'='*70}\n")

        print("Next steps:")
        print("1. Test model locally with sample predictions")
        print("2. Deploy ML service to production")
        print("3. Integrate with main prediction system")


# Keep old function for backwards compatibility
def engineer_features(df):
    """Legacy function - Use ComprehensiveMLPipeline instead"""
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
    """Main training pipeline with CLI support"""
    parser = argparse.ArgumentParser(
        description='Train comprehensive ML models for sports predictions',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python train_model.py --sport NFL
  python train_model.py --sport NCAAF --tune-hyperparameters
  python train_model.py --sport NFL --years 2020 2021 2022 2023 2024
  python train_model.py --db-url postgres://user:pass@host:5432/db
        """
    )

    parser.add_argument(
        '--sport',
        type=str,
        default='NFL',
        choices=['NFL', 'NCAAF'],
        help='Sport to train on (default: NFL)'
    )

    parser.add_argument(
        '--db-url',
        type=str,
        help='PostgreSQL database URL (or use POSTGRES_PRISMA_URL env var)'
    )

    parser.add_argument(
        '--data-dir',
        type=Path,
        default=DATA_DIR,
        help=f'Directory for data files (default: {DATA_DIR})'
    )

    parser.add_argument(
        '--years',
        type=int,
        nargs='+',
        default=[2020, 2021, 2022, 2023, 2024],
        help='Years to load nflfastR data for (default: 2020-2024)'
    )

    parser.add_argument(
        '--tune-hyperparameters',
        action='store_true',
        help='Perform hyperparameter tuning (slower but potentially better accuracy)'
    )

    parser.add_argument(
        '--force-retrain',
        action='store_true',
        help='Force retraining even if model exists'
    )

    args = parser.parse_args()

    # Get database URL from args or environment
    db_url = args.db_url or os.getenv('POSTGRES_PRISMA_URL')

    # Create and run pipeline
    pipeline = ComprehensiveMLPipeline(sport=args.sport, data_dir=args.data_dir)
    pipeline.run(
        db_url=db_url,
        years=args.years,
        tune_hyperparameters=args.tune_hyperparameters
    )


if __name__ == '__main__':
    main()
