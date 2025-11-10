import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const sport = searchParams.get('sport');
    const period = searchParams.get('period') || 'all_time';

    // Calculate date range based on period
    let startDate = new Date(0); // Beginning of time
    const endDate = new Date();

    switch (period) {
      case 'daily':
        startDate = new Date();
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'weekly':
        startDate = new Date();
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'monthly':
        startDate = new Date();
        startDate.setMonth(startDate.getMonth() - 1);
        break;
      case 'season':
        // Current NFL/NCAAF season start (September)
        startDate = new Date();
        startDate.setMonth(8, 1); // September 1
        if (new Date().getMonth() < 8) {
          startDate.setFullYear(startDate.getFullYear() - 1);
        }
        break;
    }

    // Build where clause
    const where: any = {
      wasCorrect: { not: null }, // Only completed predictions
      gameTime: {
        gte: startDate,
        lte: endDate,
      },
    };

    if (sport && sport !== 'all') {
      where.sport = sport;
    }

    // Get all predictions in period
    const predictions = await prisma.prediction.findMany({
      where,
      select: {
        wasCorrect: true,
        spreadCorrect: true,
        totalCorrect: true,
        moneylineCorrect: true,
        confidence: true,
        sport: true,
        gameTime: true,
      },
    });

    const total = predictions.length;
    const correct = predictions.filter((p) => p.wasCorrect).length;
    const accuracy = total > 0 ? (correct / total) * 100 : 0;

    // Calculate by bet type
    const spreadPredictions = predictions.filter((p) => p.spreadCorrect !== null);
    const totalPredictions = predictions.filter((p) => p.totalCorrect !== null);
    const moneylinePredictions = predictions.filter((p) => p.moneylineCorrect !== null);

    const spreadAccuracy =
      spreadPredictions.length > 0
        ? (spreadPredictions.filter((p) => p.spreadCorrect).length / spreadPredictions.length) * 100
        : 0;

    const totalAccuracy =
      totalPredictions.length > 0
        ? (totalPredictions.filter((p) => p.totalCorrect).length / totalPredictions.length) * 100
        : 0;

    const moneylineAccuracy =
      moneylinePredictions.length > 0
        ? (moneylinePredictions.filter((p) => p.moneylineCorrect).length / moneylinePredictions.length) * 100
        : 0;

    // High confidence picks (>= 70%)
    const highConfPredictions = predictions.filter((p) => p.confidence >= 70);
    const highConfAccuracy =
      highConfPredictions.length > 0
        ? (highConfPredictions.filter((p) => p.wasCorrect).length / highConfPredictions.length) * 100
        : 0;

    // Group by sport
    const bySport: Record<string, any> = {};
    for (const pred of predictions) {
      if (!bySport[pred.sport]) {
        bySport[pred.sport] = { total: 0, correct: 0 };
      }
      bySport[pred.sport].total++;
      if (pred.wasCorrect) bySport[pred.sport].correct++;
    }

    const sportBreakdown = Object.entries(bySport).map(([sport, data]: [string, any]) => ({
      sport,
      total: data.total,
      correct: data.correct,
      accuracy: (data.correct / data.total) * 100,
    }));

    // Trend data (last 7 days)
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);

      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      const dayPredictions = predictions.filter(
        (p) => new Date(p.gameTime) >= date && new Date(p.gameTime) < nextDate
      );

      last7Days.push({
        date: date.toISOString().split('T')[0],
        total: dayPredictions.length,
        correct: dayPredictions.filter((p) => p.wasCorrect).length,
        accuracy: dayPredictions.length > 0
          ? (dayPredictions.filter((p) => p.wasCorrect).length / dayPredictions.length) * 100
          : 0,
      });
    }

    return NextResponse.json({
      period,
      sport: sport || 'all',
      overall: {
        total,
        correct,
        accuracy: parseFloat(accuracy.toFixed(2)),
      },
      byBetType: {
        spread: {
          total: spreadPredictions.length,
          correct: spreadPredictions.filter((p) => p.spreadCorrect).length,
          accuracy: parseFloat(spreadAccuracy.toFixed(2)),
        },
        total: {
          total: totalPredictions.length,
          correct: totalPredictions.filter((p) => p.totalCorrect).length,
          accuracy: parseFloat(totalAccuracy.toFixed(2)),
        },
        moneyline: {
          total: moneylinePredictions.length,
          correct: moneylinePredictions.filter((p) => p.moneylineCorrect).length,
          accuracy: parseFloat(moneylineAccuracy.toFixed(2)),
        },
      },
      highConfidence: {
        total: highConfPredictions.length,
        correct: highConfPredictions.filter((p) => p.wasCorrect).length,
        accuracy: parseFloat(highConfAccuracy.toFixed(2)),
      },
      bySport: sportBreakdown,
      trend: last7Days,
    });
  } catch (error) {
    console.error('Error calculating accuracy:', error);
    return NextResponse.json(
      { error: 'Failed to calculate accuracy' },
      { status: 500 }
    );
  }
}
