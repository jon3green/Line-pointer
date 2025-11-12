import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const chartType = searchParams.get('type') || 'accuracy_trend';
    const sport = searchParams.get('sport') || undefined;

    const where: any = { wasCorrect: { not: null } };
    if (sport) where.sport = sport;

    const predictions = await prisma.prediction.findMany({
      where,
      orderBy: { madeAt: 'asc' },
      select: {
        madeAt: true,
        wasCorrect: true,
        confidence: true,
        spreadCLV: true,
        sport: true,
      },
    });

    let chartData;
    switch (chartType) {
      case 'accuracy_trend':
        chartData = generateAccuracyTrend(predictions);
        break;
      case 'confidence_calibration':
        chartData = generateConfidenceCalibration(predictions);
        break;
      case 'clv_distribution':
        chartData = generateCLVDistribution(predictions);
        break;
      case 'sport_comparison':
        chartData = generateSportComparison(predictions);
        break;
      default:
        chartData = generateAccuracyTrend(predictions);
    }

    return NextResponse.json({
      success: true,
      chartType,
      data: chartData,
    });
  } catch (error) {
    console.error('[Analytics] Charts error:', error);
    return NextResponse.json({ error: 'Failed to generate chart data' }, { status: 500 });
  }
}

function generateAccuracyTrend(predictions: any[]) {
  const grouped = groupByWeek(predictions);
  return {
    labels: grouped.map(g => g.week),
    datasets: [{
      label: 'Accuracy %',
      data: grouped.map(g => {
        const correct = g.predictions.filter((p: any) => p.wasCorrect).length;
        return Math.round((correct / g.predictions.length) * 100);
      }),
    }],
  };
}

function generateConfidenceCalibration(predictions: any[]) {
  const buckets = [50, 60, 70, 80, 90, 100];
  return {
    labels: buckets.map(b => b + '%'),
    datasets: [{
      label: 'Actual Accuracy',
      data: buckets.map(bucket => {
        const inBucket = predictions.filter(p => 
          p.confidence >= bucket - 5 && p.confidence < bucket + 5
        );
        if (inBucket.length === 0) return 0;
        const correct = inBucket.filter(p => p.wasCorrect).length;
        return Math.round((correct / inBucket.length) * 100);
      }),
    }],
  };
}

function generateCLVDistribution(predictions: any[]) {
  const withCLV = predictions.filter(p => p.spreadCLV !== null);
  const buckets = [-5, -3, -1, 0, 1, 3, 5];
  return {
    labels: buckets.map(b => b === 0 ? '0' : b > 0 ? '+' + b : b.toString()),
    datasets: [{
      label: 'Count',
      data: buckets.map(bucket => {
        return withCLV.filter(p => {
          const clv = p.spreadCLV || 0;
          if (bucket === -5) return clv <= -3;
          if (bucket === 5) return clv >= 3;
          return Math.abs(clv - bucket) < 1;
        }).length;
      }),
    }],
  };
}

function generateSportComparison(predictions: any[]) {
  const sports = [...new Set(predictions.map(p => p.sport))];
  return {
    labels: sports,
    datasets: [{
      label: 'Accuracy %',
      data: sports.map(sport => {
        const sportPreds = predictions.filter(p => p.sport === sport);
        const correct = sportPreds.filter(p => p.wasCorrect).length;
        return Math.round((correct / sportPreds.length) * 100);
      }),
    }],
  };
}

function groupByWeek(predictions: any[]) {
  const weeks = new Map<string, any[]>();
  predictions.forEach(p => {
    const date = new Date(p.madeAt);
    const weekStart = new Date(date);
    weekStart.setDate(date.getDate() - date.getDay());
    const key = weekStart.toISOString().split('T')[0];
    if (!weeks.has(key)) weeks.set(key, []);
    weeks.get(key)!.push(p);
  });
  return Array.from(weeks.entries())
    .map(([week, predictions]) => ({ week, predictions }))
    .sort((a, b) => a.week.localeCompare(b.week));
}
