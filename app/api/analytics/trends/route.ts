import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/**
 * GET /api/analytics/trends
 * Get historical performance trends and analytics
 *
 * Query params:
 * - period: 'week' | 'month' | 'season' | 'all' (default: 'month')
 * - sport: 'NFL' | 'NCAAF' (optional, defaults to all)
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'month';
    const sport = searchParams.get('sport');

    // Calculate date range based on period
    const now = new Date();
    let startDate: Date;

    switch (period) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case 'season':
        // Approximate season start (September 1 for current year)
        startDate = new Date(now.getFullYear(), 8, 1);
        break;
      case 'all':
      default:
        startDate = new Date(2020, 0, 1); // Start from 2020
    }

    // Build where clause
    const where: any = {
      createdAt: { gte: startDate },
      wasCorrect: { not: null }, // Only completed predictions
    };
    if (sport) where.sport = sport;

    // Get all completed predictions in range
    const predictions = await prisma.prediction.findMany({
      where,
      select: {
        id: true,
        sport: true,
        confidence: true,
        wasCorrect: true,
        spreadCorrect: true,
        totalCorrect: true,
        moneylineCorrect: true,
        beatTheCloseSpread: true,
        beatTheCloseTotal: true,
        spreadCLV: true,
        gameTime: true,
        createdAt: true,
      },
      orderBy: {
        gameTime: 'asc',
      },
    });

    // Calculate overall stats
    const totalPredictions = predictions.length;
    const correctPredictions = predictions.filter(p => p.wasCorrect).length;
    const overallAccuracy = totalPredictions > 0
      ? (correctPredictions / totalPredictions) * 100
      : 0;

    // Spread accuracy
    const spreadPredictions = predictions.filter(p => p.spreadCorrect !== null);
    const spreadCorrect = spreadPredictions.filter(p => p.spreadCorrect).length;
    const spreadAccuracy = spreadPredictions.length > 0
      ? (spreadCorrect / spreadPredictions.length) * 100
      : 0;

    // Total accuracy
    const totalPredictions_count = predictions.filter(p => p.totalCorrect !== null);
    const totalCorrect = totalPredictions_count.filter(p => p.totalCorrect).length;
    const totalAccuracy = totalPredictions_count.length > 0
      ? (totalCorrect / totalPredictions_count.length) * 100
      : 0;

    // Moneyline accuracy
    const mlPredictions = predictions.filter(p => p.moneylineCorrect !== null);
    const mlCorrect = mlPredictions.filter(p => p.moneylineCorrect).length;
    const mlAccuracy = mlPredictions.length > 0
      ? (mlCorrect / mlPredictions.length) * 100
      : 0;

    // High confidence performance (>70% confidence)
    const highConfPredictions = predictions.filter(p => p.confidence > 70);
    const highConfCorrect = highConfPredictions.filter(p => p.wasCorrect).length;
    const highConfAccuracy = highConfPredictions.length > 0
      ? (highConfCorrect / highConfPredictions.length) * 100
      : 0;

    // CLV metrics
    const clvPredictions = predictions.filter(
      p => p.beatTheCloseSpread !== null || p.beatTheCloseTotal !== null
    );
    const beatCloseCount = clvPredictions.filter(
      p => p.beatTheCloseSpread === true || p.beatTheCloseTotal === true
    ).length;
    const beatCloseRate = clvPredictions.length > 0
      ? (beatCloseCount / clvPredictions.length) * 100
      : 0;

    const avgCLV = predictions
      .filter(p => p.spreadCLV !== null)
      .reduce((sum, p) => sum + (p.spreadCLV || 0), 0) /
      Math.max(1, predictions.filter(p => p.spreadCLV !== null).length);

    // Group by week for trend data
    const weeklyData = new Map<string, any>();
    predictions.forEach(p => {
      const weekStart = getWeekStart(new Date(p.gameTime));
      const weekKey = weekStart.toISOString().split('T')[0];

      if (!weeklyData.has(weekKey)) {
        weeklyData.set(weekKey, {
          week: weekKey,
          date: weekStart,
          total: 0,
          correct: 0,
          spreadCorrect: 0,
          spreadTotal: 0,
        });
      }

      const week = weeklyData.get(weekKey);
      week.total++;
      if (p.wasCorrect) week.correct++;
      if (p.spreadCorrect !== null) {
        week.spreadTotal++;
        if (p.spreadCorrect) week.spreadCorrect++;
      }
    });

    // Convert to array and calculate percentages
    const trendData = Array.from(weeklyData.values())
      .sort((a, b) => a.date.getTime() - b.date.getTime())
      .map(week => ({
        week: week.week,
        accuracy: week.total > 0 ? (week.correct / week.total) * 100 : 0,
        spreadAccuracy: week.spreadTotal > 0
          ? (week.spreadCorrect / week.spreadTotal) * 100
          : 0,
        games: week.total,
      }));

    // Sport breakdown
    const sportBreakdown: Record<string, any> = {};
    ['NFL', 'NCAAF'].forEach(sportName => {
      const sportPredictions = predictions.filter(p => p.sport === sportName);
      const sportCorrect = sportPredictions.filter(p => p.wasCorrect).length;

      sportBreakdown[sportName] = {
        total: sportPredictions.length,
        correct: sportCorrect,
        accuracy: sportPredictions.length > 0
          ? (sportCorrect / sportPredictions.length) * 100
          : 0,
      };
    });

    // Recent streak
    const recentPredictions = predictions.slice(-10);
    let currentStreak = 0;
    let streakType: 'win' | 'loss' | null = null;

    for (let i = recentPredictions.length - 1; i >= 0; i--) {
      const p = recentPredictions[i];
      if (p.wasCorrect === null) break;

      if (streakType === null) {
        streakType = p.wasCorrect ? 'win' : 'loss';
        currentStreak = 1;
      } else if ((streakType === 'win' && p.wasCorrect) ||
                 (streakType === 'loss' && !p.wasCorrect)) {
        currentStreak++;
      } else {
        break;
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        overview: {
          totalPredictions,
          correctPredictions,
          overallAccuracy: Number(overallAccuracy.toFixed(1)),
          spreadAccuracy: Number(spreadAccuracy.toFixed(1)),
          totalAccuracy: Number(totalAccuracy.toFixed(1)),
          mlAccuracy: Number(mlAccuracy.toFixed(1)),
          highConfAccuracy: Number(highConfAccuracy.toFixed(1)),
          beatCloseRate: Number(beatCloseRate.toFixed(1)),
          avgCLV: Number(avgCLV.toFixed(2)),
        },
        trends: trendData,
        sportBreakdown,
        streak: {
          current: currentStreak,
          type: streakType,
        },
        period: {
          type: period,
          startDate: startDate.toISOString(),
          endDate: now.toISOString(),
        },
      },
    });
  } catch (error) {
    console.error('[API] Error fetching analytics trends:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch trends',
      },
      { status: 500 }
    );
  }
}

/**
 * Get the start of the week (Sunday) for a given date
 */
function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day;
  return new Date(d.setDate(diff));
}
