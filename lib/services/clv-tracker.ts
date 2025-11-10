/**
 * Closing Line Value (CLV) Tracker
 *
 * CLV is one of the most important metrics in sports betting.
 * It measures whether you got better odds than the closing line.
 * Consistently beating the closing line is a strong indicator of
 * long-term profitability.
 */

import { prisma } from '@/lib/prisma';

interface CLVCalculation {
  spreadCLV: number | null;
  totalCLV: number | null;
  mlCLV: number | null;
  beatTheCloseSpread: boolean | null;
  beatTheCloseTotal: boolean | null;
  beatTheCloseML: boolean | null;
}

/**
 * Calculate CLV for a prediction
 *
 * @param predictionId - The prediction ID to calculate CLV for
 * @returns CLV metrics
 */
export async function calculateCLV(predictionId: string): Promise<CLVCalculation | null> {
  try {
    const prediction = await prisma.prediction.findUnique({
      where: { id: predictionId },
    });

    if (!prediction) {
      console.error('[CLV] Prediction not found:', predictionId);
      return null;
    }

    // Get closing line (last odds snapshot before game time)
    const closingLine = await getClosingLine(
      prediction.gameId,
      prediction.externalGameId || undefined
    );

    if (!closingLine) {
      console.log('[CLV] No closing line found for game:', prediction.gameId);
      return null;
    }

    // Calculate spread CLV
    let spreadCLV: number | null = null;
    let beatTheCloseSpread: boolean | null = null;

    if (prediction.openingSpread !== null && closingLine.spread !== null) {
      // CLV is the difference between our line and closing line
      // Positive CLV means we got better odds than the market closed at
      spreadCLV = Math.abs(prediction.openingSpread) - Math.abs(closingLine.spread);

      // If we predicted the favorite, lower spread is better (beat the close if we got less than closing)
      // If we predicted the underdog, higher spread is better (beat the close if we got more than closing)
      if (prediction.predictedWinner === 'home') {
        beatTheCloseSpread = prediction.openingSpread < closingLine.spread;
      } else {
        beatTheCloseSpread = prediction.openingSpread > closingLine.spread;
      }
    }

    // Calculate total CLV
    let totalCLV: number | null = null;
    let beatTheCloseTotal: boolean | null = null;

    if (prediction.openingTotal !== null && closingLine.total !== null) {
      totalCLV = Math.abs(prediction.openingTotal - closingLine.total);

      // Determine if we beat the close based on our pick (over/under)
      if (prediction.totalPick?.toLowerCase().includes('over')) {
        // For Over picks, we want the line to go UP (more points = easier to cover)
        beatTheCloseTotal = closingLine.total > prediction.openingTotal;
      } else if (prediction.totalPick?.toLowerCase().includes('under')) {
        // For Under picks, we want the line to go DOWN (fewer points = easier to cover)
        beatTheCloseTotal = closingLine.total < prediction.openingTotal;
      }
    }

    // Calculate moneyline CLV (in terms of implied probability)
    let mlCLV: number | null = null;
    let beatTheCloseML: boolean | null = null;

    if (prediction.openingML !== null && closingLine.homeML !== null) {
      const openingProb = americanOddsToImpliedProbability(prediction.openingML);
      const closingProb = americanOddsToImpliedProbability(closingLine.homeML);

      // CLV is the difference in implied probability
      mlCLV = closingProb - openingProb;

      // Beat the close if closing line gives us better value (lower implied probability)
      beatTheCloseML = closingProb < openingProb;
    }

    return {
      spreadCLV,
      totalCLV,
      mlCLV,
      beatTheCloseSpread,
      beatTheCloseTotal,
      beatTheCloseML,
    };
  } catch (error) {
    console.error('[CLV] Error calculating CLV:', error);
    return null;
  }
}

/**
 * Get the closing line for a game (last odds before game starts)
 */
async function getClosingLine(gameId: string, externalGameId?: string) {
  try {
    // Find the last odds snapshot before game time
    const closingOdds = await prisma.oddsHistory.findFirst({
      where: {
        OR: [
          { gameId: gameId },
          ...(externalGameId ? [{ externalGameId: externalGameId }] : []),
        ],
        timestamp: {
          lte: new Date(), // Only get odds up to now
        },
      },
      orderBy: {
        timestamp: 'desc',
      },
    });

    return closingOdds;
  } catch (error) {
    console.error('[CLV] Error fetching closing line:', error);
    return null;
  }
}

/**
 * Update prediction with CLV data
 */
export async function updatePredictionWithCLV(predictionId: string): Promise<boolean> {
  try {
    const clv = await calculateCLV(predictionId);

    if (!clv) {
      console.log('[CLV] Could not calculate CLV for prediction:', predictionId);
      return false;
    }

    // Get closing line for additional data
    const prediction = await prisma.prediction.findUnique({
      where: { id: predictionId },
    });

    if (!prediction) return false;

    const closingLine = await getClosingLine(
      prediction.gameId,
      prediction.externalGameId || undefined
    );

    // Update prediction with CLV data
    await prisma.prediction.update({
      where: { id: predictionId },
      data: {
        spreadCLV: clv.spreadCLV,
        totalCLV: clv.totalCLV,
        mlCLV: clv.mlCLV,
        beatTheCloseSpread: clv.beatTheCloseSpread,
        beatTheCloseTotal: clv.beatTheCloseTotal,
        beatTheCloseML: clv.beatTheCloseML,
        closingSpread: closingLine?.spread,
        closingTotal: closingLine?.total,
        closingML: closingLine?.homeML,
        closingLineCapturedAt: new Date(),
      },
    });

    console.log('[CLV] Updated prediction with CLV:', {
      predictionId,
      spreadCLV: clv.spreadCLV,
      beatTheCloseSpread: clv.beatTheCloseSpread,
    });

    return true;
  } catch (error) {
    console.error('[CLV] Error updating prediction with CLV:', error);
    return false;
  }
}

/**
 * Calculate CLV metrics for all predictions for a specific sport/timeframe
 */
export async function calculateCLVMetrics(
  sport?: string,
  startDate?: Date,
  endDate?: Date
) {
  try {
    const where: any = {};

    if (sport) where.sport = sport;
    if (startDate || endDate) {
      where.gameTime = {};
      if (startDate) where.gameTime.gte = startDate;
      if (endDate) where.gameTime.lte = endDate;
    }

    // Only get predictions where we have CLV data
    where.beatTheCloseSpread = { not: null };

    const predictions = await prisma.prediction.findMany({
      where,
      select: {
        spreadCLV: true,
        totalCLV: true,
        mlCLV: true,
        beatTheCloseSpread: true,
        beatTheCloseTotal: true,
        beatTheCloseML: true,
        wasCorrect: true,
        spreadCorrect: true,
        totalCorrect: true,
        confidence: true,
      },
    });

    if (predictions.length === 0) {
      return {
        totalPredictions: 0,
        avgSpreadCLV: 0,
        avgTotalCLV: 0,
        beatCloseRate: 0,
        beatCloseWinRate: 0,
      };
    }

    // Calculate averages
    const spreadCLVs = predictions
      .map(p => p.spreadCLV)
      .filter(clv => clv !== null) as number[];

    const totalCLVs = predictions
      .map(p => p.totalCLV)
      .filter(clv => clv !== null) as number[];

    const avgSpreadCLV = spreadCLVs.length > 0
      ? spreadCLVs.reduce((sum, clv) => sum + clv, 0) / spreadCLVs.length
      : 0;

    const avgTotalCLV = totalCLVs.length > 0
      ? totalCLVs.reduce((sum, clv) => sum + clv, 0) / totalCLVs.length
      : 0;

    // Beat the close rate
    const beatCloseCount = predictions.filter(
      p => p.beatTheCloseSpread === true || p.beatTheCloseTotal === true
    ).length;
    const beatCloseRate = (beatCloseCount / predictions.length) * 100;

    // Win rate when beating the close
    const beatCloseWins = predictions.filter(
      p =>
        (p.beatTheCloseSpread === true || p.beatTheCloseTotal === true) &&
        (p.spreadCorrect === true || p.totalCorrect === true)
    ).length;
    const beatCloseWinRate = beatCloseCount > 0
      ? (beatCloseWins / beatCloseCount) * 100
      : 0;

    return {
      totalPredictions: predictions.length,
      avgSpreadCLV: Number(avgSpreadCLV.toFixed(2)),
      avgTotalCLV: Number(avgTotalCLV.toFixed(2)),
      beatCloseRate: Number(beatCloseRate.toFixed(1)),
      beatCloseWinRate: Number(beatCloseWinRate.toFixed(1)),
      spreadCLVDistribution: {
        positive: spreadCLVs.filter(clv => clv > 0).length,
        neutral: spreadCLVs.filter(clv => clv === 0).length,
        negative: spreadCLVs.filter(clv => clv < 0).length,
      },
    };
  } catch (error) {
    console.error('[CLV] Error calculating CLV metrics:', error);
    return null;
  }
}

/**
 * Convert American odds to implied probability
 */
function americanOddsToImpliedProbability(odds: number): number {
  if (odds > 0) {
    // Underdog odds
    return 100 / (odds + 100);
  } else {
    // Favorite odds
    return Math.abs(odds) / (Math.abs(odds) + 100);
  }
}

/**
 * Batch update CLV for all predictions that don't have it yet
 * Run this as a cron job after games complete
 */
export async function batchUpdateCLV(limit = 50): Promise<{
  processed: number;
  updated: number;
  errors: number;
}> {
  try {
    // Find predictions without CLV data where game has passed
    const predictions = await prisma.prediction.findMany({
      where: {
        closingLineCapturedAt: null,
        gameTime: {
          lt: new Date(), // Game has already started/completed
        },
      },
      take: limit,
      select: {
        id: true,
      },
    });

    let updated = 0;
    let errors = 0;

    for (const prediction of predictions) {
      const success = await updatePredictionWithCLV(prediction.id);
      if (success) {
        updated++;
      } else {
        errors++;
      }
    }

    console.log('[CLV] Batch update complete:', {
      processed: predictions.length,
      updated,
      errors,
    });

    return {
      processed: predictions.length,
      updated,
      errors,
    };
  } catch (error) {
    console.error('[CLV] Error in batch update:', error);
    return {
      processed: 0,
      updated: 0,
      errors: 1,
    };
  }
}
