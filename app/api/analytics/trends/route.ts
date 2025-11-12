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
    const sport = searchParams.get('sport') || undefined;
    const period = searchParams.get('period') || 'daily';
    const limit = parseInt(searchParams.get('limit') || '30');

    const where: any = { wasCorrect: { not: null } };
    if (sport) where.sport = sport;

    const predictions = await prisma.prediction.findMany({
      where,
      orderBy: { createdAt: 'asc' },
      select: {
        createdAt: true,
        wasCorrect: true,
        confidence: true,
        spreadCLV: true,
        beatTheCloseSpread: true,
      },
    });

    if (predictions.length === 0) {
      return NextResponse.json({
        success: true,
        trends: [],
        message: 'No prediction data available yet',
      });
    }

    const grouped = groupByPeriod(predictions, period);
    const trends = grouped.map((group) => {
      const total = group.predictions.length;
      const correct = group.predictions.filter((p: any) => p.wasCorrect).length;
      const accuracy = total > 0 ? correct / total : 0;
      
      const avgConfidence = group.predictions.reduce((sum: number, p: any) => sum + p.confidence, 0) / total;
      const withCLV = group.predictions.filter((p: any) => p.spreadCLV !== null);
      const avgCLV = withCLV.length > 0
        ? withCLV.reduce((sum: number, p: any) => sum + (p.spreadCLV || 0), 0) / withCLV.length
        : 0;
      
      return {
        date: group.date,
        totalPredictions: total,
        correctPredictions: correct,
        accuracy: Math.round(accuracy * 1000) / 10,
        avgConfidence: Math.round(avgConfidence * 10) / 10,
        avgCLV: Math.round(avgCLV * 100) / 100,
      };
    }).slice(-limit);

    return NextResponse.json({
      success: true,
      trends,
      filters: { sport, period, limit },
    });
  } catch (error) {
    console.error('[Analytics] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch trends' }, { status: 500 });
  }
}

function groupByPeriod(predictions: any[], period: string) {
  const groups = new Map<string, any[]>();
  predictions.forEach(pred => {
    const date = new Date(pred.createdAt);
    let key: string;
    if (period === 'daily') {
      key = date.toISOString().split('T')[0];
    } else if (period === 'weekly') {
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay());
      key = weekStart.toISOString().split('T')[0];
    } else {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      key = year + '-' + month + '-01';
    }
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(pred);
  });
  return Array.from(groups.entries())
    .map(([date, predictions]) => ({ date, predictions }))
    .sort((a, b) => a.date.localeCompare(b.date));
}
