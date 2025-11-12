/**
 * Post-Mortem Analysis System
 *
 * Analyzes incorrect predictions to identify systematic errors
 * and suggest model improvements
 *
 * Features:
 * - Pattern detection in wrong predictions
 * - Feature contribution analysis
 * - Confidence calibration issues
 * - Situational weaknesses
 * - Recommended improvements
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface PostMortemResult {
  totalAnalyzed: number;
  incorrectPredictions: number;
  patterns: PostMortemPattern[];
  recommendations: string[];
  featureIssues: FeatureIssue[];
  calibrationIssues: CalibrationIssue[];
}

export interface PostMortemPattern {
  pattern: string;
  count: number;
  percentage: number;
  avgConfidence: number;
  description: string;
  severity: 'high' | 'medium' | 'low';
}

export interface FeatureIssue {
  feature: string;
  issue: string;
  impactedPredictions: number;
  suggestedFix: string;
}

export interface CalibrationIssue {
  confidenceRange: string;
  predicted: number;
  actual: number;
  error: number;
  sampleSize: number;
}

/**
 * Run post-mortem analysis on recent predictions
 */
export async function runPostMortem(
  daysBack: number = 30,
  sport?: string
): Promise<PostMortemResult> {
  console.log('[PostMortem] Starting analysis...');

  const startDate = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000);

  // Fetch predictions with results
  const where: any = {
    wasCorrect: false, // Only incorrect predictions
    createdAt: { gte: startDate },
  };

  if (sport) where.sport = sport;

  const incorrectPredictions = await prisma.prediction.findMany({
    where,
    include: {
      game: true,
    },
  });

  console.log(`[PostMortem] Analyzing ${incorrectPredictions.length} incorrect predictions`);

  const patterns: PostMortemPattern[] = [];
  const featureIssues: FeatureIssue[] = [];
  const calibrationIssues: CalibrationIssue[] = [];
  const recommendations: string[] = [];

  // ===== PATTERN DETECTION =====

  // Pattern 1: High confidence failures
  const highConfidenceWrong = incorrectPredictions.filter(p => p.confidence >= 70);
  if (highConfidenceWrong.length > 0) {
    patterns.push({
      pattern: 'High Confidence Failures',
      count: highConfidenceWrong.length,
      percentage: (highConfidenceWrong.length / incorrectPredictions.length) * 100,
      avgConfidence: highConfidenceWrong.reduce((sum, p) => sum + p.confidence, 0) / highConfidenceWrong.length,
      description: 'Model is overconfident in these predictions',
      severity: 'high',
    });

    recommendations.push(
      'Reduce confidence levels for predictions with similar feature patterns'
    );
    recommendations.push(
      'Add penalty term for overconfidence in loss function'
    );
  }

  // Pattern 2: Division game failures
  const divisionGames = incorrectPredictions.filter(p => {
    // TODO: Check if division game from factors
    return false; // Placeholder
  });

  if (divisionGames.length > 10) {
    patterns.push({
      pattern: 'Division Game Failures',
      count: divisionGames.length,
      percentage: (divisionGames.length / incorrectPredictions.length) * 100,
      avgConfidence: divisionGames.reduce((sum, p) => sum + p.confidence, 0) / divisionGames.length,
      description: 'Model struggles with division matchups',
      severity: 'medium',
    });

    featureIssues.push({
      feature: 'isDivisionGame',
      issue: 'Not weighted heavily enough',
      impactedPredictions: divisionGames.length,
      suggestedFix: 'Increase weight of isDivisionGame feature by 25%',
    });

    recommendations.push(
      'Add "division familiarity" feature (3rd meeting this season)'
    );
  }

  // Pattern 3: Prime time game failures
  const primeTimeGames = incorrectPredictions.filter(p => {
    const gameTime = new Date(p.gameTime);
    return gameTime.getHours() >= 19;
  });

  if (primeTimeGames.length > 15) {
    patterns.push({
      pattern: 'Prime Time Game Failures',
      count: primeTimeGames.length,
      percentage: (primeTimeGames.length / incorrectPredictions.length) * 100,
      avgConfidence: primeTimeGames.reduce((sum, p) => sum + p.confidence, 0) / primeTimeGames.length,
      description: 'Model underperforms in prime time games',
      severity: 'medium',
    });

    recommendations.push(
      'Add "prime time performance history" feature for each team'
    );
  }

  // Pattern 4: Weather-impacted games
  // TODO: Check weather data
  // If temperature < 40°F or windSpeed > 20mph

  // Pattern 5: Upset predictions
  const upsets = incorrectPredictions.filter(p => {
    // Predicted underdog to win but they lost
    return p.predictedWinner === 'away' && p.confidence >= 55;
  });

  if (upsets.length > 20) {
    patterns.push({
      pattern: 'Upset Prediction Failures',
      count: upsets.length,
      percentage: (upsets.length / incorrectPredictions.length) * 100,
      avgConfidence: upsets.reduce((sum, p) => sum + p.confidence, 0) / upsets.length,
      description: 'Model overestimates underdog chances',
      severity: 'high',
    });

    featureIssues.push({
      feature: 'homeFieldAdvantage',
      issue: 'Undervalued in model',
      impactedPredictions: upsets.length,
      suggestedFix: 'Increase home field advantage weight by 15%',
    });
  }

  // Pattern 6: Travel distance impact
  // TODO: Check if away team traveled > 1500 miles

  // Pattern 7: Rest days differential
  // TODO: Check if one team had 3+ more rest days

  // ===== CALIBRATION ANALYSIS =====
  const allPredictions = await prisma.prediction.findMany({
    where: {
      wasCorrect: { not: null },
      createdAt: { gte: startDate },
    },
  });

  const confidenceRanges = [
    { min: 50, max: 60 },
    { min: 60, max: 70 },
    { min: 70, max: 80 },
    { min: 80, max: 90 },
    { min: 90, max: 100 },
  ];

  for (const range of confidenceRanges) {
    const inRange = allPredictions.filter(
      p => p.confidence >= range.min && p.confidence < range.max
    );

    if (inRange.length > 5) {
      const correctInRange = inRange.filter(p => p.wasCorrect).length;
      const actualAccuracy = (correctInRange / inRange.length) * 100;
      const expectedAccuracy = (range.min + range.max) / 2;
      const error = actualAccuracy - expectedAccuracy;

      if (Math.abs(error) > 5) {
        calibrationIssues.push({
          confidenceRange: `${range.min}-${range.max}%`,
          predicted: expectedAccuracy,
          actual: actualAccuracy,
          error,
          sampleSize: inRange.length,
        });

        if (error > 0) {
          recommendations.push(
            `Model is underconfident for ${range.min}-${range.max}% predictions (increase by ${error.toFixed(1)}%)`
          );
        } else {
          recommendations.push(
            `Model is overconfident for ${range.min}-${range.max}% predictions (decrease by ${Math.abs(error).toFixed(1)}%)`
          );
        }
      }
    }
  }

  // ===== FEATURE-SPECIFIC ISSUES =====

  // Check if certain features are always wrong
  // This would require parsing the factors JSON from predictions

  // Example: If injuries were significant but we lost
  const injuryRelated = incorrectPredictions.filter(p => {
    // TODO: Parse factors and check homeInjuryImpact > 5 or awayInjuryImpact > 5
    return false; // Placeholder
  });

  if (injuryRelated.length > 10) {
    featureIssues.push({
      feature: 'injuryImpact',
      issue: 'Not weighted heavily enough in model',
      impactedPredictions: injuryRelated.length,
      suggestedFix: 'Increase injury impact weight by 30%',
    });
  }

  // ===== GENERATE RECOMMENDATIONS =====

  if (patterns.length === 0) {
    recommendations.push('No systematic patterns detected. Model is performing well.');
  }

  if (patterns.some(p => p.severity === 'high')) {
    recommendations.push(
      '🚨 HIGH PRIORITY: Address high-severity patterns immediately'
    );
  }

  // Sort patterns by severity and count
  patterns.sort((a, b) => {
    if (a.severity === 'high' && b.severity !== 'high') return -1;
    if (a.severity !== 'high' && b.severity === 'high') return 1;
    return b.count - a.count;
  });

  const result: PostMortemResult = {
    totalAnalyzed: incorrectPredictions.length,
    incorrectPredictions: incorrectPredictions.length,
    patterns,
    recommendations: [...new Set(recommendations)], // Remove duplicates
    featureIssues,
    calibrationIssues,
  };

  console.log('[PostMortem] Analysis complete:', {
    patterns: patterns.length,
    recommendations: recommendations.length,
    featureIssues: featureIssues.length,
  });

  return result;
}

/**
 * Get detailed breakdown of a specific pattern
 */
export async function analyzePattern(
  pattern: string,
  daysBack: number = 30
): Promise<any> {
  // TODO: Implement detailed analysis for specific pattern
  return {
    pattern,
    detailedAnalysis: 'Coming soon',
  };
}

/**
 * Export post-mortem results for model retraining
 */
export function exportForRetraining(result: PostMortemResult): string {
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      totalIncorrect: result.incorrectPredictions,
      patternsFound: result.patterns.length,
      issuesFound: result.featureIssues.length,
    },
    actionItems: result.recommendations,
    featureAdjustments: result.featureIssues.map(issue => ({
      feature: issue.feature,
      adjustment: issue.suggestedFix,
    })),
    calibrationAdjustments: result.calibrationIssues.map(issue => ({
      range: issue.confidenceRange,
      adjustment: `${issue.error > 0 ? 'increase' : 'decrease'} by ${Math.abs(issue.error).toFixed(1)}%`,
    })),
  };

  return JSON.stringify(report, null, 2);
}

export default {
  runPostMortem,
  analyzePattern,
  exportForRetraining,
};
