import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const gameId = searchParams.get('gameId');
    const minEV = parseFloat(searchParams.get('minEV') || '5');

    if (!gameId) {
      return NextResponse.json({ error: 'gameId required' }, { status: 400 });
    }

    const liveData = await prisma.liveGameData.findFirst({
      where: { gameId },
      orderBy: { timestamp: 'desc' },
    });

    if (!liveData || !liveData.recommendations) {
      return NextResponse.json({
        success: true,
        recommendations: [],
        message: 'No live recommendations available',
      });
    }

    const allRecs = JSON.parse(liveData.recommendations);
    const filteredRecs = allRecs.filter((r: any) => r.ev >= minEV);

    return NextResponse.json({
      success: true,
      gameId,
      gameState: {
        quarter: liveData.quarter,
        timeRemaining: liveData.timeRemaining,
        score: { home: liveData.homeScore, away: liveData.awayScore },
      },
      recommendations: filteredRecs,
      count: filteredRecs.length,
    });
  } catch (error) {
    console.error('[Live] Recommendations error:', error);
    return NextResponse.json({ error: 'Failed to fetch recommendations' }, { status: 500 });
  }
}
