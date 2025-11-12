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
    const showRLMOnly = searchParams.get('rlmOnly') === 'true';
    const showSharpOnly = searchParams.get('sharpOnly') === 'true';

    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const where: any = { gameTime: { gte: now, lte: tomorrow } };
    if (sport) where.sport = sport;
    if (showRLMOnly) where.isRLM = true;
    if (showSharpOnly) where.isSharpSide = true;

    const publicData = await prisma.publicBettingData.findMany({
      where,
      orderBy: { gameTime: 'asc' },
    });

    const formatted = publicData.map(data => ({
      gameId: data.gameId,
      sport: data.sport,
      homeTeam: data.homeTeam,
      awayTeam: data.awayTeam,
      gameTime: data.gameTime,
      spread: {
        publicHome: data.spreadPublicHome,
        moneyHome: data.spreadMoneyHome,
        sharpSide: data.spreadMoneyHome && data.spreadPublicHome && data.spreadMoneyHome > data.spreadPublicHome + 10 ? 'home' : 'away',
      },
      indicators: { isRLM: data.isRLM, isSharpSide: data.isSharpSide, publicFade: data.publicFade },
      timestamp: data.timestamp,
    }));

    return NextResponse.json({ success: true, indicators: formatted, count: formatted.length });
  } catch (error) {
    console.error('[Sharp] Indicators error:', error);
    return NextResponse.json({ error: 'Failed to fetch sharp indicators' }, { status: 500 });
  }
}
