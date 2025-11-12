import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const dynamic = 'force-dynamic';

/**
 * ML Model Accuracy Check
 *
 * Calculates current model accuracy across multiple dimensions:
 * - Overall accuracy
 * - By confidence level (high/medium/low)
 * - By sport (NFL/NCAAF)
 * - By bet type (spread/total/ML)
 * - CLV (Closing Line Value)
 * - ROI if betting $100/game
 */
export async function POST(request: Request) {
  try {
    console.log('[AccuracyCheck] Calculating model performance...');

    // Get all predictions with results (last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const predictions = await prisma.prediction.findMany({
      where: {
        wasCorrect: { not: null },
        createdAt: { gte: thirtyDaysAgo },
      },
      select: {
        id: true,
        sport: true,
        confidence: true,
        wasCorrect: true,
        spreadCorrect: true,
        totalCorrect: true,
        moneylineCorrect: true,
        spreadCLV: true,
        beatTheCloseSpread: true,
        createdAt: true,
      },
    });

    console.log(`[AccuracyCheck] Analyzing ${predictions.length} predictions`);

    // ===== OVERALL ACCURACY =====
    const totalPredictions = predictions.length;
    const correctPredictions = predictions.filter(p => p.wasCorrect).length;
    const overallAccuracy = (correctPredictions / totalPredictions) * 100;

    // ===== ACCURACY BY CONFIDENCE =====
    const highConfidence = predictions.filter(p => p.confidence >= 70);
    const mediumConfidence = predictions.filter(p => p.confidence >= 55 && p.confidence < 70);
    const lowConfidence = predictions.filter(p => p.confidence < 55);

    const accuracyByConfidence = {
      high: {
        total: highConfidence.length,
        correct: highConfidence.filter(p => p.wasCorrect).length,
        accuracy: (highConfidence.filter(p => p.wasCorrect).length / highConfidence.length) * 100,
      },
      medium: {
        total: mediumConfidence.length,
        correct: mediumConfidence.filter(p => p.wasCorrect).length,
        accuracy: (mediumConfidence.filter(p => p.wasCorrect).length / mediumConfidence.length) * 100,
      },
      low: {
        total: lowConfidence.length,
        correct: lowConfidence.filter(p => p.wasCorrect).length,
        accuracy: (lowConfidence.filter(p => p.wasCorrect).length / lowConfidence.length) * 100,
      },
    };

    // ===== ACCURACY BY SPORT =====
    const nflPredictions = predictions.filter(p => p.sport === 'NFL');
    const ncaafPredictions = predictions.filter(p => p.sport === 'NCAAF');

    const accuracyBySport = {
      nfl: {
        total: nflPredictions.length,
        correct: nflPredictions.filter(p => p.wasCorrect).length,
        accuracy: (nflPredictions.filter(p => p.wasCorrect).length / nflPredictions.length) * 100,
      },
      ncaaf: {
        total: ncaafPredictions.length,
        correct: ncaafPredictions.filter(p => p.wasCorrect).length,
        accuracy: (ncaafPredictions.filter(p => p.wasCorrect).length / ncaafPredictions.length) * 100,
      },
    };

    // ===== ACCURACY BY BET TYPE =====
    const spreadPredictions = predictions.filter(p => p.spreadCorrect !== null);
    const totalPredictions2 = predictions.filter(p => p.totalCorrect !== null);
    const mlPredictions = predictions.filter(p => p.moneylineCorrect !== null);

    const accuracyByBetType = {
      spread: {
        total: spreadPredictions.length,
        correct: spreadPredictions.filter(p => p.spreadCorrect).length,
        accuracy: (spreadPredictions.filter(p => p.spreadCorrect).length / spreadPredictions.length) * 100,
      },
      total: {
        total: totalPredictions2.length,
        correct: totalPredictions2.filter(p => p.totalCorrect).length,
        accuracy: (totalPredictions2.filter(p => p.totalCorrect).length / totalPredictions2.length) * 100,
      },
      moneyline: {
        total: mlPredictions.length,
        correct: mlPredictions.filter(p => p.moneylineCorrect).length,
        accuracy: (mlPredictions.filter(p => p.moneylineCorrect).length / mlPredictions.length) * 100,
      },
    };

    // ===== CLV (CLOSING LINE VALUE) =====
    const predictionsWithCLV = predictions.filter(p => p.spreadCLV !== null);
    const avgCLV =
      predictionsWithCLV.reduce((sum, p) => sum + (p.spreadCLV || 0), 0) / predictionsWithCLV.length;

    const beatClosingLine = predictions.filter(p => p.beatTheCloseSpread).length;
    const beatClosingLinePct = (beatClosingLine / predictions.length) * 100;

    // ===== ROI CALCULATION =====
    const stake = 100; // $100 per bet
    let totalProfit = 0;

    predictions.forEach(p => {
      if (p.spreadCorrect) {
        totalProfit += stake * 0.91; // Win $91 on $100 bet at -110 odds
      } else {
        totalProfit -= stake;
      }
    });

    const roi = (totalProfit / (totalPredictions * stake)) * 100;

    // ===== CALIBRATION CHECK =====
    // Are 70% confidence predictions actually correct 70% of the time?
    const calibration = {
      '60-65': calculateCalibration(predictions, 60, 65),
      '65-70': calculateCalibration(predictions, 65, 70),
      '70-75': calculateCalibration(predictions, 70, 75),
      '75-80': calculateCalibration(predictions, 75, 80),
      '80+': calculateCalibration(predictions, 80, 100),
    };

    // ===== RECENT TREND =====
    const last7Days = predictions.filter(
      p => new Date(p.createdAt) >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    );
    const last7DaysAccuracy = (last7Days.filter(p => p.wasCorrect).length / last7Days.length) * 100;

    const result = {
      success: true,
      timestamp: new Date().toISOString(),
      summary: {
        totalPredictions,
        correctPredictions,
        overallAccuracy: overallAccuracy.toFixed(2) + '%',
        avgCLV: avgCLV.toFixed(3),
        beatClosingLinePct: beatClosingLinePct.toFixed(1) + '%',
        roi: roi.toFixed(2) + '%',
        totalProfit: `$${totalProfit.toFixed(2)}`,
      },
      byConfidence: accuracyByConfidence,
      bySport: accuracyBySport,
      byBetType: accuracyByBetType,
      calibration,
      recentTrend: {
        last7Days: last7Days.length,
        last7DaysAccuracy: last7DaysAccuracy.toFixed(1) + '%',
      },
    };

    console.log('[AccuracyCheck] Results:', result.summary);

    return NextResponse.json(result);
  } catch (error) {
    console.error('[AccuracyCheck] Error:', error);
    return NextResponse.json(
      {
        error: 'Failed to calculate accuracy',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

function calculateCalibration(predictions: any[], minConf: number, maxConf: number) {
  const filtered = predictions.filter(p => p.confidence >= minConf && p.confidence < maxConf);

  if (filtered.length === 0) {
    return { total: 0, correct: 0, accuracy: 0, expectedAccuracy: (minConf + maxConf) / 2 };
  }

  const correct = filtered.filter(p => p.wasCorrect).length;
  const accuracy = (correct / filtered.length) * 100;
  const expectedAccuracy = (minConf + maxConf) / 2;
  const calibrationError = Math.abs(accuracy - expectedAccuracy);

  return {
    total: filtered.length,
    correct,
    accuracy: accuracy.toFixed(1) + '%',
    expectedAccuracy: expectedAccuracy.toFixed(1) + '%',
    calibrationError: calibrationError.toFixed(1),
  };
}
