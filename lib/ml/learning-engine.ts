/**
 * Machine Learning Learning Engine
 * Analyzes past predictions to improve future accuracy
 */

import { prisma } from '../prisma';

interface MLAdjustments {
  spreadBias: number;
  totalBias: number;
  confidenceCalibration: number;
  sportSpecificAdjustments: Record<string, number>;
  factorWeights: Record<string, number>;
}

interface PredictionError {
  predictedSpread: number;
  actualSpread: number;
  predictedTotal: number;
  actualTotal: number;
  confidence: number;
  wasCorrect: boolean;
  sport: string;
}

/**
 * Calculate ML adjustments based on historical performance
 */
export async function calculateMLAdjustments(
  sport?: string,
  daysBack: number = 30
): Promise<MLAdjustments> {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - daysBack);

  // Get all predictions with results
  const predictions = await prisma.prediction.findMany({
    where: {
      createdAt: { gte: startDate },
      wasCorrect: { not: null },
      sport: sport || undefined,
    },
    select: {
      sport: true,
      predictedSpread: true,
      actualSpread: true,
      predictedTotal: true,
      actualTotal: true,
      confidence: true,
      wasCorrect: true,
      spreadCorrect: true,
      totalCorrect: true,
      factors: true,
    },
  });

  if (predictions.length === 0) {
    return getDefaultAdjustments();
  }

  // Calculate spread bias (are we consistently over/under predicting?)
  const spreadErrors = predictions
    .filter((p) => p.predictedSpread !== null && p.actualSpread !== null)
    .map((p) => (p.actualSpread || 0) - (p.predictedSpread || 0));

  const spreadBias = spreadErrors.length > 0
    ? spreadErrors.reduce((sum, err) => sum + err, 0) / spreadErrors.length
    : 0;

  // Calculate total bias
  const totalErrors = predictions
    .filter((p) => p.predictedTotal !== null && p.actualTotal !== null)
    .map((p) => (p.actualTotal || 0) - (p.predictedTotal || 0));

  const totalBias = totalErrors.length > 0
    ? totalErrors.reduce((sum, err) => sum + err, 0) / totalErrors.length
    : 0;

  // Calculate confidence calibration (are we over/under confident?)
  const confidenceCalibration = calculateConfidenceCalibration(predictions);

  // Calculate sport-specific adjustments
  const sportSpecificAdjustments = calculateSportAdjustments(predictions);

  // Calculate factor weights based on what actually predicts wins
  const factorWeights = calculateFactorWeights(predictions);

  return {
    spreadBias: Number(spreadBias.toFixed(2)),
    totalBias: Number(totalBias.toFixed(2)),
    confidenceCalibration: Number(confidenceCalibration.toFixed(3)),
    sportSpecificAdjustments,
    factorWeights,
  };
}

/**
 * Calculate confidence calibration
 * If we're 70% confident, we should win 70% of the time
 */
function calculateConfidenceCalibration(predictions: any[]): number {
  const confidenceBuckets: Record<number, { total: number; correct: number }> = {};

  predictions.forEach((p) => {
    const bucket = Math.floor(p.confidence / 10) * 10;
    if (!confidenceBuckets[bucket]) {
      confidenceBuckets[bucket] = { total: 0, correct: 0 };
    }
    confidenceBuckets[bucket].total++;
    if (p.wasCorrect) confidenceBuckets[bucket].correct++;
  });

  let totalDiff = 0;
  let bucketCount = 0;

  Object.entries(confidenceBuckets).forEach(([bucket, data]) => {
    const expectedWinRate = Number(bucket) / 100;
    const actualWinRate = data.correct / data.total;
    totalDiff += actualWinRate - expectedWinRate;
    bucketCount++;
  });

  // Positive = we're under-confident, negative = over-confident
  return bucketCount > 0 ? totalDiff / bucketCount : 0;
}

/**
 * Calculate sport-specific win rate adjustments
 */
function calculateSportAdjustments(predictions: any[]): Record<string, number> {
  const sportStats: Record<string, { total: number; correct: number }> = {};

  predictions.forEach((p) => {
    if (!sportStats[p.sport]) {
      sportStats[p.sport] = { total: 0, correct: 0 };
    }
    sportStats[p.sport].total++;
    if (p.wasCorrect) sportStats[p.sport].correct++;
  });

  const adjustments: Record<string, number> = {};
  const overallWinRate = predictions.filter((p) => p.wasCorrect).length / predictions.length;

  Object.entries(sportStats).forEach(([sport, stats]) => {
    const sportWinRate = stats.correct / stats.total;
    // If we perform better in this sport, boost confidence; worse, reduce it
    adjustments[sport] = Number(((sportWinRate - overallWinRate) * 100).toFixed(2));
  });

  return adjustments;
}

/**
 * Calculate which prediction factors are most predictive
 */
function calculateFactorWeights(predictions: any[]): Record<string, number> {
  const factorPerformance: Record<string, { total: number; correct: number; totalImpact: number }> = {};

  predictions.forEach((p) => {
    if (!p.factors) return;

    let factors;
    try {
      factors = typeof p.factors === 'string' ? JSON.parse(p.factors) : p.factors;
    } catch {
      return;
    }

    if (!Array.isArray(factors)) return;

    factors.forEach((factor: any) => {
      if (!factor.name) return;

      if (!factorPerformance[factor.name]) {
        factorPerformance[factor.name] = { total: 0, correct: 0, totalImpact: 0 };
      }

      factorPerformance[factor.name].total++;
      factorPerformance[factor.name].totalImpact += factor.impact || 0;
      if (p.wasCorrect) {
        factorPerformance[factor.name].correct++;
      }
    });
  });

  const weights: Record<string, number> = {};

  Object.entries(factorPerformance).forEach(([factor, stats]) => {
    const winRate = stats.correct / stats.total;
    const avgImpact = stats.totalImpact / stats.total;
    // Weight = (win rate - 0.5) * average impact
    // Factors that win more often should be weighted higher
    weights[factor] = Number(((winRate - 0.5) * avgImpact).toFixed(2));
  });

  return weights;
}

/**
 * Get default adjustments when no data is available
 */
function getDefaultAdjustments(): MLAdjustments {
  return {
    spreadBias: 0,
    totalBias: 0,
    confidenceCalibration: 0,
    sportSpecificAdjustments: {},
    factorWeights: {
      'Market Spread Influence': 1.0,
      'Moneyline Differential': 1.0,
      'Projected Total Pace': 1.0,
    },
  };
}

/**
 * Apply ML adjustments to a prediction
 */
export function applyMLAdjustments(
  prediction: {
    predictedScore: { home: number; away: number };
    confidence: number;
    factors: { name: string; impact: number }[];
  },
  adjustments: MLAdjustments,
  sport: string
): {
  predictedScore: { home: number; away: number };
  confidence: number;
  factors: { name: string; impact: number }[];
} {
  // Adjust spread
  const currentSpread = prediction.predictedScore.home - prediction.predictedScore.away;
  const adjustedSpread = currentSpread - adjustments.spreadBias;

  const total = prediction.predictedScore.home + prediction.predictedScore.away;
  const adjustedTotal = total - adjustments.totalBias;

  // Recalculate scores
  const adjustedHome = Math.round((adjustedTotal + adjustedSpread) / 2);
  const adjustedAway = Math.round((adjustedTotal - adjustedSpread) / 2);

  // Adjust confidence
  let adjustedConfidence = prediction.confidence;

  // Apply confidence calibration
  adjustedConfidence += adjustments.confidenceCalibration * 100;

  // Apply sport-specific adjustment
  if (adjustments.sportSpecificAdjustments[sport]) {
    adjustedConfidence += adjustments.sportSpecificAdjustments[sport];
  }

  // Clamp confidence to 50-95%
  adjustedConfidence = Math.max(50, Math.min(95, adjustedConfidence));

  // Adjust factor impacts based on learned weights
  const adjustedFactors = prediction.factors.map((factor) => {
    const weight = adjustments.factorWeights[factor.name] || 0;
    return {
      name: factor.name,
      impact: Math.max(0, Math.round(factor.impact + weight)),
    };
  });

  return {
    predictedScore: {
      home: Math.max(0, adjustedHome),
      away: Math.max(0, adjustedAway),
    },
    confidence: Number(adjustedConfidence.toFixed(1)),
    factors: adjustedFactors,
  };
}

/**
 * Generate ML insights report
 */
export async function generateMLInsights(daysBack: number = 30): Promise<{
  summary: string;
  improvements: string[];
  adjustments: MLAdjustments;
  performance: {
    totalPredictions: number;
    accuracy: number;
    spreadAccuracy: number;
    totalAccuracy: number;
  };
}> {
  const adjustments = await calculateMLAdjustments(undefined, daysBack);

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - daysBack);

  const predictions = await prisma.prediction.findMany({
    where: {
      createdAt: { gte: startDate },
      wasCorrect: { not: null },
    },
  });

  const totalPredictions = predictions.length;
  const correct = predictions.filter((p) => p.wasCorrect).length;
  const spreadCorrect = predictions.filter((p) => p.spreadCorrect).length;
  const totalCorrect = predictions.filter((p) => p.totalCorrect).length;

  const improvements: string[] = [];

  if (Math.abs(adjustments.spreadBias) > 2) {
    improvements.push(
      `Spread predictions are consistently ${adjustments.spreadBias > 0 ? 'too low' : 'too high'} by ${Math.abs(adjustments.spreadBias).toFixed(1)} points`
    );
  }

  if (Math.abs(adjustments.totalBias) > 3) {
    improvements.push(
      `Total predictions are consistently ${adjustments.totalBias > 0 ? 'too low' : 'too high'} by ${Math.abs(adjustments.totalBias).toFixed(1)} points`
    );
  }

  if (adjustments.confidenceCalibration > 0.05) {
    improvements.push('Model is under-confident - can be more aggressive with high-confidence picks');
  } else if (adjustments.confidenceCalibration < -0.05) {
    improvements.push('Model is over-confident - should be more conservative');
  }

  const topFactor = Object.entries(adjustments.factorWeights)
    .sort(([, a], [, b]) => b - a)[0];

  if (topFactor) {
    improvements.push(`"${topFactor[0]}" is the most predictive factor (weight: ${topFactor[1].toFixed(2)})`);
  }

  return {
    summary: `Analyzed ${totalPredictions} predictions from the last ${daysBack} days. Overall accuracy: ${((correct / totalPredictions) * 100).toFixed(1)}%`,
    improvements,
    adjustments,
    performance: {
      totalPredictions,
      accuracy: Number(((correct / totalPredictions) * 100).toFixed(1)),
      spreadAccuracy: Number(((spreadCorrect / totalPredictions) * 100).toFixed(1)),
      totalAccuracy: Number(((totalCorrect / totalPredictions) * 100).toFixed(1)),
    },
  };
}
