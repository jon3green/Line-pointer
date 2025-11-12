/**
 * Prediction Tracking Service - ML Learning System Core
 *
 * This is the heart of the self-learning prediction system:
 * - Stores every prediction with 50+ decision factors
 * - Tracks actual results and calculates accuracy metrics
 * - Analyzes factor correlations for model improvement
 * - Provides CLV (Closing Line Value) tracking
 * - Exports training data for ML pipeline
 */

import { prisma } from '../prisma';
import type { Game } from '../types';

// Comprehensive factor tracking for ML training
export interface PredictionFactors {
  // Team Performance Metrics
  homeOffensiveEff?: number;
  awayOffensiveEff?: number;
  homeDefensiveEff?: number;
  awayDefensiveEff?: number;
  homeYardsPerPlay?: number;
  awayYardsPerPlay?: number;
  homeSuccessRate?: number;
  awaySuccessRate?: number;
  homeExplosivePlayRate?: number;
  awayExplosivePlayRate?: number;
  homeRedZoneEff?: number;
  awayRedZoneEff?: number;
  homeThirdDownConv?: number;
  awayThirdDownConv?: number;

  // Rest and Schedule
  restDaysHome?: number;
  restDaysAway?: number;
  homeStrengthOfSchedule?: number;
  awayStrengthOfSchedule?: number;

  // Weather Impact
  temperature?: number;
  windSpeed?: number;
  precipitation?: number;
  weatherImpactScore?: number;

  // Injuries
  homeKeyInjuries?: number;
  awayKeyInjuries?: number;
  homeInjuryImpact?: number;
  awayInjuryImpact?: number;

  // Recent Form
  homeLast5Record?: string;
  awayLast5Record?: string;
  homePointsPerGameL5?: number;
  awayPointsPerGameL5?: number;
  homePointsAllowedL5?: number;
  awayPointsAllowedL5?: number;

  // Situational
  homeATS?: number;
  awayATS?: number;
  homeVsTop10?: number;
  awayVsTop10?: number;
  headToHeadHistory?: string;

  // Line Movement & Market
  openingSpread?: number;
  currentSpread?: number;
  lineMovement?: number;
  sharpAction?: boolean;
  publicBettingPercent?: number;

  // EPA and Advanced Stats (nflfastR)
  homeEPAPerPlay?: number;
  awayEPAPerPlay?: number;
  homePassEPA?: number;
  awayPassEPA?: number;
  homeRunEPA?: number;
  awayRunEPA?: number;

  // Model Metadata
  modelVersion?: string;
  confidenceFactors?: string[];
  timestamp?: string;
}

export interface PredictionInput {
  game: Game;
  modelVersion?: string;
  factors?: PredictionFactors;
}

export interface PredictionStats {
  totalPredictions: number;
  correctPredictions: number;
  accuracy: number;
  avgConfidence: number;
  avgSpreadCLV: number;
  beatTheCloseRate: number;
  byConfidenceRange: { range: string; count: number; accuracy: number }[];
  bySport: { sport: string; accuracy: number; count: number }[];
  recentTrend: { last10Accuracy: number; last25Accuracy: number; last50Accuracy: number };
}

/**
 * Save a prediction with comprehensive factor tracking
 */
export async function savePrediction(input: PredictionInput) {
  const { game, modelVersion = 'v1.0', factors } = input;

  if (!game.prediction) {
    console.warn(`[Prediction] No prediction available for game ${game.id}`);
    return null;
  }

  try {
    // Check if prediction already exists
    const existing = await prisma.prediction.findFirst({
      where: { gameId: game.id, modelVersion },
    });

    // Merge factors from game prediction and input
    const allFactors: PredictionFactors = {
      ...(game.prediction.factors || {}),
      ...(factors || {}),
      modelVersion,
      timestamp: new Date().toISOString(),
    };

    const predictionData = {
      gameId: game.id,
      externalGameId: game.id,
      sport: game.league,
      homeTeam: game.homeTeam.name,
      awayTeam: game.awayTeam.name,
      gameTime: new Date(game.date),
      predictedWinner: game.prediction.winner,
      confidence: game.prediction.confidence,
      predictedSpread: game.prediction.predictedScore?.home && game.prediction.predictedScore?.away
        ? game.prediction.predictedScore.home - game.prediction.predictedScore.away
        : null,
      predictedTotal: game.prediction.predictedScore?.home && game.prediction.predictedScore?.away
        ? game.prediction.predictedScore.home + game.prediction.predictedScore.away
        : null,
      openingSpread: game.odds?.spread?.home || null,
      spreadPick: game.odds?.spread
        ? `${game.prediction.winner === 'home' ? game.homeTeam.abbreviation : game.awayTeam.abbreviation} ${
            game.prediction.winner === 'home' ? game.odds.spread.home : game.odds.spread.away
          }`
        : null,
      totalPick: game.odds?.total ? `${game.prediction.winner === 'home' ? 'Over' : 'Under'} ${game.odds.total.line}` : null,
      moneylinePick: `${game.prediction.winner === 'home' ? game.homeTeam.abbreviation : game.awayTeam.abbreviation} ML`,
      modelVersion,
      factors: JSON.stringify(allFactors),
      madeAt: new Date(),
    };

    if (existing) {
      const updated = await prisma.prediction.update({
        where: { id: existing.id },
        data: { ...predictionData, updatedAt: new Date() },
      });
      console.log(`[Prediction] Updated prediction ${updated.id} for game ${game.id}`);
      return updated;
    }

    const prediction = await prisma.prediction.create({ data: predictionData });

    // Create alert for high confidence predictions
    if (game.prediction.confidence >= 70) {
      await prisma.predictionAlert.create({
        data: {
          predictionId: prediction.id,
          type: game.prediction.confidence >= 85 ? 'high_confidence' : 'value_bet',
          title: `${game.prediction.confidence >= 85 ? '🔥' : '💎'} ${game.prediction.confidence.toFixed(1)}% Confidence`,
          message: `${game.homeTeam.name} vs ${game.awayTeam.name}: ${predictionData.spreadPick || predictionData.moneylinePick}`,
          confidence: game.prediction.confidence,
          sport: game.league,
          homeTeam: game.homeTeam.name,
          awayTeam: game.awayTeam.name,
          gameTime: new Date(game.date),
          pick: predictionData.spreadPick || predictionData.moneylinePick || '',
        },
      });
    }

    console.log(`[Prediction] Created prediction ${prediction.id} for game ${game.id}`);
    return prediction;
  } catch (error) {
    console.error('[Prediction] Error saving prediction:', error);
    return null;
  }
}

/**
 * Save predictions for multiple games
 */
export async function savePredictions(games: Game[], modelVersion = 'v1.0') {
  const results = [];
  for (const game of games) {
    const prediction = await savePrediction({ game, modelVersion });
    if (prediction) results.push(prediction);
  }
  console.log(`[Prediction] Saved ${results.length}/${games.length} predictions`);
  return results;
}

/**
 * Update prediction with actual game results and calculate CLV
 */
export async function updateGameResults(gameId: string, externalGameId: string, closingSpread?: number) {
  try {
    const prediction = await prisma.prediction.findFirst({
      where: {
        OR: [{ gameId }, { externalGameId }],
        actualWinner: null,
      },
    });

    if (!prediction) return null;

    // Fetch result from ESPN
    const espnUrl = `https://site.api.espn.com/apis/site/v2/sports/football/${
      prediction.sport === 'NFL' ? 'nfl' : 'college-football'
    }/scoreboard/${externalGameId}`;

    const response = await fetch(espnUrl);
    const data = await response.json();

    if (!data.competitions?.[0]) return null;

    const competition = data.competitions[0];
    const status = competition.status?.type?.name;

    if (status !== 'STATUS_FINAL') return null;

    const homeCompetitor = competition.competitors.find((c: any) => c.homeAway === 'home');
    const awayCompetitor = competition.competitors.find((c: any) => c.homeAway === 'away');

    if (!homeCompetitor || !awayCompetitor) return null;

    const homeScore = parseInt(homeCompetitor.score || '0');
    const awayScore = parseInt(awayCompetitor.score || '0');
    const actualWinner = homeScore > awayScore ? 'home' : awayScore > homeScore ? 'away' : 'push';
    const actualSpread = homeScore - awayScore;
    const actualTotal = homeScore + awayScore;

    // Calculate correctness
    const wasCorrect = prediction.predictedWinner === actualWinner;
    const spreadCorrect = prediction.predictedSpread
      ? Math.abs((prediction.predictedSpread || 0) - actualSpread) <= 3
      : null;
    const totalCorrect = prediction.predictedTotal
      ? Math.abs((prediction.predictedTotal || 0) - actualTotal) <= 5
      : null;

    // Calculate CLV (Closing Line Value)
    const spreadCLV = closingSpread !== null && closingSpread !== undefined && prediction.openingSpread !== null
      ? Math.abs(actualSpread - closingSpread) - Math.abs(actualSpread - prediction.openingSpread)
      : null;

    const beatTheClose = spreadCLV !== null ? spreadCLV > 0 : null;

    // Update prediction with results
    const updated = await prisma.prediction.update({
      where: { id: prediction.id },
      data: {
        homeScore,
        awayScore,
        actualWinner,
        actualSpread,
        actualTotal,
        wasCorrect,
        spreadCorrect,
        totalCorrect,
        moneylineCorrect: wasCorrect,
        closingSpread,
        spreadCLV,
        beatTheCloseSpread: beatTheClose,
        resultsFetchedAt: new Date(),
      },
    });

    // Update related alert
    const alert = await prisma.predictionAlert.findFirst({
      where: { predictionId: prediction.id },
    });

    if (alert && alert.actedOn) {
      await prisma.predictionAlert.update({
        where: { id: alert.id },
        data: { outcome: wasCorrect ? 'won' : 'lost' },
      });
    }

    console.log(`[Prediction] Updated results for ${prediction.id}: ${wasCorrect ? 'CORRECT' : 'INCORRECT'}, CLV: ${spreadCLV}`);
    return updated;
  } catch (error) {
    console.error('[Prediction] Error updating game results:', error);
    return null;
  }
}

/**
 * Get comprehensive prediction statistics
 */
export async function getPredictionStats(filters?: {
  sport?: string;
  startDate?: Date;
  endDate?: Date;
  minConfidence?: number;
}): Promise<PredictionStats> {
  try {
    const where: any = { wasCorrect: { not: null } };

    if (filters?.sport) where.sport = filters.sport;
    if (filters?.startDate || filters?.endDate) {
      where.madeAt = {};
      if (filters.startDate) where.madeAt.gte = filters.startDate;
      if (filters.endDate) where.madeAt.lte = filters.endDate;
    }
    if (filters?.minConfidence) where.confidence = { gte: filters.minConfidence };

    const predictions = await prisma.prediction.findMany({
      where,
      orderBy: { madeAt: 'desc' },
    });

    const totalPredictions = predictions.length;
    const correctPredictions = predictions.filter(p => p.wasCorrect).length;
    const accuracy = totalPredictions > 0 ? correctPredictions / totalPredictions : 0;
    const avgConfidence = predictions.reduce((sum, p) => sum + p.confidence, 0) / (totalPredictions || 1);

    const withCLV = predictions.filter(p => p.spreadCLV !== null);
    const avgSpreadCLV = withCLV.length > 0
      ? withCLV.reduce((sum, p) => sum + (p.spreadCLV || 0), 0) / withCLV.length
      : 0;

    const withCloseData = predictions.filter(p => p.beatTheCloseSpread !== null);
    const beatTheCloseRate = withCloseData.length > 0
      ? withCloseData.filter(p => p.beatTheCloseSpread).length / withCloseData.length
      : 0;

    // By confidence range
    const confidenceRanges = [
      { range: '90-100%', min: 90, max: 100 },
      { range: '80-89%', min: 80, max: 89 },
      { range: '70-79%', min: 70, max: 79 },
      { range: '60-69%', min: 60, max: 69 },
      { range: '50-59%', min: 50, max: 59 },
    ];

    const byConfidenceRange = confidenceRanges.map(({ range, min, max }) => {
      const inRange = predictions.filter(p => p.confidence >= min && p.confidence <= max);
      const correct = inRange.filter(p => p.wasCorrect).length;
      return { range, count: inRange.length, accuracy: inRange.length > 0 ? correct / inRange.length : 0 };
    });

    // By sport
    const sportGroups = predictions.reduce((acc, p) => {
      if (!acc[p.sport]) acc[p.sport] = [];
      acc[p.sport].push(p);
      return acc;
    }, {} as Record<string, typeof predictions>);

    const bySport = Object.entries(sportGroups).map(([sport, preds]) => ({
      sport,
      count: preds.length,
      accuracy: preds.filter(p => p.wasCorrect).length / preds.length,
    }));

    // Recent trend
    const last10 = predictions.slice(0, 10);
    const last25 = predictions.slice(0, 25);
    const last50 = predictions.slice(0, 50);

    const recentTrend = {
      last10Accuracy: last10.length > 0 ? last10.filter(p => p.wasCorrect).length / last10.length : 0,
      last25Accuracy: last25.length > 0 ? last25.filter(p => p.wasCorrect).length / last25.length : 0,
      last50Accuracy: last50.length > 0 ? last50.filter(p => p.wasCorrect).length / last50.length : 0,
    };

    return {
      totalPredictions,
      correctPredictions,
      accuracy,
      avgConfidence,
      avgSpreadCLV,
      beatTheCloseRate,
      byConfidenceRange,
      bySport,
      recentTrend,
    };
  } catch (error) {
    console.error('[Prediction] Error getting stats:', error);
    throw error;
  }
}

/**
 * Analyze which factors correlate with prediction accuracy
 * This is the ML feedback loop - identifies what works
 */
export async function analyzeFactorCorrelations(filters?: {
  sport?: string;
  minSampleSize?: number;
}) {
  try {
    const where: any = { wasCorrect: { not: null } };
    if (filters?.sport) where.sport = filters.sport;

    const predictions = await prisma.prediction.findMany({ where });

    const minSampleSize = filters?.minSampleSize || 20;
    if (predictions.length < minSampleSize) {
      return {
        error: 'Insufficient data for analysis',
        sampleSize: predictions.length,
        minRequired: minSampleSize,
      };
    }

    // Parse factors and analyze correlations
    const factorAccuracy: Record<string, { correct: number; total: number; avgValue: number }> = {};

    predictions.forEach(prediction => {
      try {
        const factors = JSON.parse(prediction.factors as string) as PredictionFactors;
        const wasCorrect = prediction.wasCorrect;

        Object.entries(factors).forEach(([key, value]) => {
          if (typeof value === 'number') {
            if (!factorAccuracy[key]) {
              factorAccuracy[key] = { correct: 0, total: 0, avgValue: 0 };
            }
            factorAccuracy[key].total++;
            factorAccuracy[key].avgValue += value;
            if (wasCorrect) factorAccuracy[key].correct++;
          }
        });
      } catch (error) {
        // Skip invalid factor JSON
      }
    });

    // Calculate correlation scores
    const correlations = Object.entries(factorAccuracy)
      .map(([factor, stats]) => ({
        factor,
        accuracy: stats.total > 0 ? stats.correct / stats.total : 0,
        sampleSize: stats.total,
        avgValue: stats.total > 0 ? stats.avgValue / stats.total : 0,
      }))
      .filter(f => f.sampleSize >= Math.min(minSampleSize / 2, 10))
      .sort((a, b) => b.accuracy - a.accuracy);

    // Identify top performers
    const overallAccuracy = predictions.filter(p => p.wasCorrect).length / predictions.length;
    const strongCorrelations = correlations.filter(c => c.accuracy > overallAccuracy + 0.05);
    const weakCorrelations = correlations.filter(c => c.accuracy < overallAccuracy - 0.05);

    console.log(`[Analysis] Analyzed ${predictions.length} predictions, found ${correlations.length} factors`);
    console.log(`[Analysis] Strong factors: ${strongCorrelations.slice(0, 5).map(f => f.factor).join(', ')}`);

    return {
      overallAccuracy,
      totalPredictions: predictions.length,
      allCorrelations: correlations,
      strongPositiveFactors: strongCorrelations.slice(0, 10),
      weakFactors: weakCorrelations.slice(-10),
      insights: {
        mostReliableFactors: strongCorrelations.slice(0, 5).map(f => f.factor),
        leastReliableFactors: weakCorrelations.slice(-5).map(f => f.factor),
      },
    };
  } catch (error) {
    console.error('[Analysis] Error analyzing factor correlations:', error);
    throw error;
  }
}

/**
 * Export prediction data for ML training (Python pipeline)
 */
export async function exportTrainingData(filters?: {
  sport?: string;
  startDate?: Date;
  endDate?: Date;
}) {
  try {
    const where: any = { wasCorrect: { not: null } };

    if (filters?.sport) where.sport = filters.sport;
    if (filters?.startDate || filters?.endDate) {
      where.madeAt = {};
      if (filters.startDate) where.madeAt.gte = filters.startDate;
      if (filters.endDate) where.madeAt.lte = filters.endDate;
    }

    const predictions = await prisma.prediction.findMany({
      where,
      orderBy: { madeAt: 'asc' },
    });

    // Transform to ML-friendly format
    const trainingData = predictions.map(p => {
      let factors: PredictionFactors = {};
      try {
        factors = JSON.parse(p.factors as string);
      } catch (e) {
        // Empty factors if parse fails
      }

      return {
        // Features (X)
        ...factors,
        // Labels (y)
        actualWinner: p.actualWinner,
        wasCorrect: p.wasCorrect,
        actualSpread: p.actualSpread,
        // Metadata
        predictionId: p.id,
        gameId: p.gameId,
        sport: p.sport,
        predictionDate: p.madeAt,
        confidence: p.confidence,
      };
    });

    console.log(`[Export] Exported ${trainingData.length} predictions for ML training`);
    return trainingData;
  } catch (error) {
    console.error('[Export] Error exporting training data:', error);
    throw error;
  }
}

/**
 * Get predictions pending result updates
 */
export async function getPendingPredictions(limit: number = 50) {
  try {
    return await prisma.prediction.findMany({
      where: {
        wasCorrect: null,
        gameTime: { lte: new Date() }, // Game should have started
      },
      orderBy: { gameTime: 'asc' },
      take: limit,
    });
  } catch (error) {
    console.error('[Prediction] Error getting pending predictions:', error);
    throw error;
  }
}
