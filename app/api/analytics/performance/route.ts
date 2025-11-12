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

    const predictions = await prisma.prediction.findMany({
      where: { wasCorrect: { not: null } },
      select: {
        sport: true,
        wasCorrect: true,
        confidence: true,
        spreadCorrect: true,
        totalCorrect: true,
        moneylineCorrect: true,
      },
    });

    if (predictions.length === 0) {
      return NextResponse.json({
        success: true,
        performance: { bySport: [], byConfidence: [], byBetType: [] },
      });
    }

    const bySport = calculateBySport(predictions);
    const byConfidence = calculateByConfidence(predictions);
    const byBetType = calculateByBetType(predictions);

    return NextResponse.json({
      success: true,
      performance: {
        bySport,
        byConfidence,
        byBetType,
      },
    });
  } catch (error) {
    console.error('[Analytics] Performance error:', error);
    return NextResponse.json({ error: 'Failed to fetch performance' }, { status: 500 });
  }
}

function calculateBySport(predictions: any[]) {
  const sports = new Map<string, { total: number; correct: number }>();
  
  predictions.forEach(p => {
    if (!sports.has(p.sport)) {
      sports.set(p.sport, { total: 0, correct: 0 });
    }
    const stats = sports.get(p.sport)!;
    stats.total++;
    if (p.wasCorrect) stats.correct++;
  });

  return Array.from(sports.entries()).map(([sport, stats]) => ({
    sport,
    totalPredictions: stats.total,
    correctPredictions: stats.correct,
    accuracy: Math.round((stats.correct / stats.total) * 1000) / 10,
  }));
}

function calculateByConfidence(predictions: any[]) {
  const ranges = [
    { label: '90-100%', min: 90, max: 100 },
    { label: '80-89%', min: 80, max: 89 },
    { label: '70-79%', min: 70, max: 79 },
    { label: '60-69%', min: 60, max: 69 },
    { label: '50-59%', min: 50, max: 59 },
  ];

  return ranges.map(range => {
    const inRange = predictions.filter(p => p.confidence >= range.min && p.confidence <= range.max);
    const correct = inRange.filter(p => p.wasCorrect).length;
    return {
      range: range.label,
      totalPredictions: inRange.length,
      correctPredictions: correct,
      accuracy: inRange.length > 0 ? Math.round((correct / inRange.length) * 1000) / 10 : 0,
    };
  });
}

function calculateByBetType(predictions: any[]) {
  const types = [
    { type: 'Spread', key: 'spreadCorrect' },
    { type: 'Total', key: 'totalCorrect' },
    { type: 'Moneyline', key: 'moneylineCorrect' },
  ];

  return types.map(({ type, key }) => {
    const withData = predictions.filter(p => p[key] !== null);
    const correct = withData.filter(p => p[key]).length;
    return {
      betType: type,
      totalPredictions: withData.length,
      correctPredictions: correct,
      accuracy: withData.length > 0 ? Math.round((correct / withData.length) * 1000) / 10 : 0,
    };
  });
}
