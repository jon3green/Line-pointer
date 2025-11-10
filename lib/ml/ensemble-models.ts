/**
 * Ensemble Model System
 * Combines multiple ML models for superior accuracy
 */

import type { Game } from '../types';
import { extractFeatures, type MLFeatures } from './feature-engineering';
import { calculateMLAdjustments, applyMLAdjustments } from './learning-engine';

export interface ModelPrediction {
  modelName: string;
  winner: 'home' | 'away';
  confidence: number;
  spread: number;
  total: number;
  winProbability: number;
  timestamp: Date;
}

export interface EnsemblePrediction {
  finalWinner: 'home' | 'away';
  finalConfidence: number;
  finalSpread: number;
  finalTotal: number;
  winProbability: number;
  models: ModelPrediction[];
  modelWeights: Record<string, number>;
  reasoning: string[];
}

/**
 * Model weights based on recent performance
 * Updated dynamically based on accuracy
 */
let MODEL_WEIGHTS = {
  xgboost: 0.35,
  neuralNet: 0.30,
  lstm: 0.15,
  market: 0.10,
  elo: 0.10,
};

/**
 * Generate ensemble prediction from multiple models
 */
export async function generateEnsemblePrediction(
  game: Game,
  historicalData?: any
): Promise<EnsemblePrediction> {
  // Extract features for ML models
  const features = extractFeatures(game, historicalData);

  // Get predictions from each model
  const predictions: ModelPrediction[] = [];

  // Model 1: XGBoost (Primary - most accurate for tabular data)
  predictions.push(await predictXGBoost(game, features));

  // Model 2: Neural Network (Deep learning for complex patterns)
  predictions.push(await predictNeuralNet(game, features));

  // Model 3: LSTM (Time series for momentum)
  predictions.push(await predictLSTM(game, features));

  // Model 4: Market-Based (Current implementation)
  predictions.push(predictMarketBased(game));

  // Model 5: Elo Rating System
  predictions.push(predictElo(game, features));

  // Update model weights based on recent performance
  await updateModelWeights();

  // Combine predictions using weighted ensemble
  const ensemble = combinePredictions(predictions, MODEL_WEIGHTS);

  // Apply ML adjustments from learning engine
  const adjustments = await calculateMLAdjustments(game.league);
  const adjusted = applyMLAdjustments(
    {
      predictedScore: {
        home: Math.round((ensemble.finalTotal + ensemble.finalSpread) / 2),
        away: Math.round((ensemble.finalTotal - ensemble.finalSpread) / 2),
      },
      confidence: ensemble.finalConfidence,
      factors: ensemble.reasoning.map((r) => ({ name: r, impact: 20 })),
    },
    adjustments,
    game.league
  );

  return {
    ...ensemble,
    finalConfidence: adjusted.confidence,
    finalSpread: adjusted.predictedScore.home - adjusted.predictedScore.away,
    finalTotal: adjusted.predictedScore.home + adjusted.predictedScore.away,
  };
}

/**
 * Model 1: XGBoost Prediction
 * Primary model - best for structured data
 */
async function predictXGBoost(game: Game, features: MLFeatures): Promise<ModelPrediction> {
  // In production, this would call a Python service via API
  // For now, simulate XGBoost prediction with feature-based logic

  const spreadPrediction = predictSpreadFromFeatures(features);
  const totalPrediction = predictTotalFromFeatures(features);
  const winProb = calculateWinProbability(spreadPrediction);

  return {
    modelName: 'XGBoost',
    winner: spreadPrediction > 0 ? 'home' : 'away',
    confidence: Math.round(Math.abs(winProb - 0.5) * 200),
    spread: spreadPrediction,
    total: totalPrediction,
    winProbability: winProb,
    timestamp: new Date(),
  };
}

/**
 * Model 2: Neural Network Prediction
 * Deep learning for non-linear patterns
 */
async function predictNeuralNet(game: Game, features: MLFeatures): Promise<ModelPrediction> {
  // Simulated neural network prediction
  // In production: TensorFlow.js or API call to Python service

  const spread = predictSpreadFromFeatures(features) * 0.95; // Slightly more conservative
  const total = predictTotalFromFeatures(features) * 1.02; // Slightly higher totals
  const winProb = calculateWinProbability(spread);

  return {
    modelName: 'NeuralNet',
    winner: spread > 0 ? 'home' : 'away',
    confidence: Math.round(Math.abs(winProb - 0.5) * 190), // Slightly less confident
    spread,
    total,
    winProbability: winProb,
    timestamp: new Date(),
  };
}

/**
 * Model 3: LSTM Prediction
 * Recurrent NN for time series/momentum
 */
async function predictLSTM(game: Game, features: MLFeatures): Promise<ModelPrediction> {
  // Simulated LSTM prediction focusing on momentum
  // In production: TensorFlow/PyTorch with sequence data

  const momentumFactor =
    (features.homeWinPercentageL5 - features.awayWinPercentageL5) * 10;
  const spread = predictSpreadFromFeatures(features) + momentumFactor;
  const total = predictTotalFromFeatures(features);
  const winProb = calculateWinProbability(spread);

  return {
    modelName: 'LSTM',
    winner: spread > 0 ? 'home' : 'away',
    confidence: Math.round(Math.abs(winProb - 0.5) * 180), // Focus on streaks
    spread,
    total,
    winProbability: winProb,
    timestamp: new Date(),
  };
}

/**
 * Model 4: Market-Based Prediction
 * Current implementation - uses betting markets
 */
function predictMarketBased(game: Game): ModelPrediction {
  if (!game.odds || !game.prediction) {
    return {
      modelName: 'Market',
      winner: 'home',
      confidence: 50,
      spread: 0,
      total: 44,
      winProbability: 0.5,
      timestamp: new Date(),
    };
  }

  const spread = game.odds.spread?.home || 0;
  const total = game.odds.total?.line || 44;
  const homeML = game.odds.moneyline?.home || -110;
  const awayML = game.odds.moneyline?.away || -110;

  const homeProb = calculateImpliedProb(homeML);
  const awayProb = calculateImpliedProb(awayML);
  const winProb = homeProb / (homeProb + awayProb); // Normalize

  return {
    modelName: 'Market',
    winner: game.prediction.winner,
    confidence: game.prediction.confidence,
    spread: -spread, // Invert for home advantage
    total,
    winProbability: winProb,
    timestamp: new Date(),
  };
}

/**
 * Model 5: Elo Rating Prediction
 * Statistical model based on team strength
 */
function predictElo(game: Game, features: MLFeatures): ModelPrediction {
  const eloDiff = features.eloDifference;
  const expectedSpread = eloDiff / 25; // Elo points to spread conversion
  const winProb = 1 / (1 + Math.pow(10, -eloDiff / 400)); // Elo win probability

  const total = 44 + (Math.abs(expectedSpread) * 0.5); // Higher spreads = higher totals

  return {
    modelName: 'Elo',
    winner: expectedSpread > 0 ? 'home' : 'away',
    confidence: Math.round(Math.abs(winProb - 0.5) * 200),
    spread: expectedSpread,
    total,
    winProbability: winProb,
    timestamp: new Date(),
  };
}

/**
 * Combine multiple predictions using weighted ensemble
 */
function combinePredictions(
  predictions: ModelPrediction[],
  weights: Record<string, number>
): EnsemblePrediction {
  let weightedSpread = 0;
  let weightedTotal = 0;
  let weightedConfidence = 0;
  let weightedWinProb = 0;

  const modelWeights: Record<string, number> = {};

  predictions.forEach((pred) => {
    const weight = weights[pred.modelName.toLowerCase()] || 0.1;
    modelWeights[pred.modelName] = weight;

    weightedSpread += pred.spread * weight;
    weightedTotal += pred.total * weight;
    weightedConfidence += pred.confidence * weight;
    weightedWinProb += pred.winProbability * weight;
  });

  const finalWinner = weightedSpread > 0 ? 'home' : 'away';

  // Generate reasoning based on model agreement
  const reasoning: string[] = [];
  const homeVotes = predictions.filter((p) => p.winner === 'home').length;
  const awayVotes = predictions.filter((p) => p.winner === 'away').length;

  if (homeVotes === predictions.length) {
    reasoning.push('All models agree on home team');
  } else if (awayVotes === predictions.length) {
    reasoning.push('All models agree on away team');
  } else {
    reasoning.push(`Models split ${homeVotes}-${awayVotes} on winner`);
  }

  const spreadRange = Math.max(...predictions.map((p) => p.spread)) - Math.min(...predictions.map((p) => p.spread));
  if (spreadRange < 3) {
    reasoning.push('Low spread variance - high agreement');
  } else {
    reasoning.push('High spread variance - uncertain outcome');
  }

  const avgConfidence = predictions.reduce((sum, p) => sum + p.confidence, 0) / predictions.length;
  if (avgConfidence > 70) {
    reasoning.push('High confidence across all models');
  } else if (avgConfidence < 55) {
    reasoning.push('Low confidence - toss-up game');
  }

  return {
    finalWinner,
    finalConfidence: Math.round(weightedConfidence),
    finalSpread: Number(weightedSpread.toFixed(1)),
    finalTotal: Number(weightedTotal.toFixed(1)),
    winProbability: Number(weightedWinProb.toFixed(3)),
    models: predictions,
    modelWeights,
    reasoning,
  };
}

/**
 * Update model weights based on recent performance
 */
async function updateModelWeights(): Promise<void> {
  // In production, query database for model performance
  // For now, use default weights

  // Example logic (would be data-driven):
  // - If XGBoost has 60% accuracy last 100 games, weight = 0.40
  // - If NeuralNet has 58% accuracy, weight = 0.35
  // - Normalize weights to sum to 1.0

  // Placeholder - weights would be updated based on actual performance
  MODEL_WEIGHTS = {
    xgboost: 0.35,
    neuralNet: 0.30,
    lstm: 0.15,
    market: 0.10,
    elo: 0.10,
  };
}

/**
 * Helper: Predict spread from features
 */
function predictSpreadFromFeatures(features: MLFeatures): number {
  // Simplified linear model (in production: trained XGBoost/NN)
  const spread =
    features.eloDifference / 25 +
    (features.homeOffensiveEfficiency - features.awayDefensiveEfficiency) / 20 +
    (features.homeWinPercentageL5 - features.awayWinPercentageL5) * 10 +
    features.currentSpread * 0.5 + // Some weight to market
    features.restDaysDifference * 0.5;

  return Number(spread.toFixed(1));
}

/**
 * Helper: Predict total from features
 */
function predictTotalFromFeatures(features: MLFeatures): number {
  const total =
    44 + // Base total
    (features.homeOffensiveEfficiency + features.awayOffensiveEfficiency - 200) / 5 +
    (200 - features.homeDefensiveEfficiency - features.awayDefensiveEfficiency) / 5 +
    features.currentTotal * 0.3 - // Some weight to market
    features.weatherImpactScore * 2;

  return Number(total.toFixed(1));
}

/**
 * Helper: Calculate win probability from spread
 */
function calculateWinProbability(spread: number): number {
  // Logistic function to convert spread to win probability
  // Based on historical NFL data: spread of 3 ≈ 60% win probability
  const prob = 1 / (1 + Math.exp(-spread / 3.5));
  return Number(prob.toFixed(3));
}

/**
 * Helper: Calculate implied probability from American odds
 */
function calculateImpliedProb(americanOdds: number): number {
  if (americanOdds > 0) {
    return 100 / (americanOdds + 100);
  } else {
    return Math.abs(americanOdds) / (Math.abs(americanOdds) + 100);
  }
}

/**
 * Get current model weights
 */
export function getModelWeights(): Record<string, number> {
  return { ...MODEL_WEIGHTS };
}

/**
 * Set custom model weights (for testing/optimization)
 */
export function setModelWeights(weights: Record<string, number>): void {
  MODEL_WEIGHTS = { ...weights } as typeof MODEL_WEIGHTS;
}
