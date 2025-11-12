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
    const sport = searchParams.get('sport') || undefined;

    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const where: any = {
      gameTime: { gte: now, lte: tomorrow },
      isRLM: true,
    };
    if (sport) where.sport = sport;

    const rlmGames = await prisma.publicBettingData.findMany({
      where,
      orderBy: { gameTime: 'asc' },
    });

    const formatted = rlmGames.map(data => ({
      gameId: data.gameId,
      sport: data.sport,
      matchup: data.awayTeam + ' @ ' + data.homeTeam,
      gameTime: data.gameTime,
      rlmDetails: {
        type: 'spread',
        publicPercentage: data.spreadPublicHome || 0,
        moneyPercentage: data.spreadMoneyHome || 0,
        lineMoved: 'towards ' + data.homeTeam,
        indication: 'Sharp money on ' + data.homeTeam,
      },
      timestamp: data.timestamp,
    }));

    return NextResponse.json({ success: true, rlmGames: formatted, count: formatted.length });
  } catch (error) {
    console.error('[Sharp] RLM error:', error);
    return NextResponse.json({ error: 'Failed to fetch RLM data' }, { status: 500 });
  }
}
