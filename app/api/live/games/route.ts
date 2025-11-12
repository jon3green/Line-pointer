import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/**
 * GET - Get live game data with current scores, odds, and win probability
 */
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const sport = searchParams.get('sport') || undefined;
    const gameId = searchParams.get('gameId') || undefined;

    if (gameId) {
      const liveData = await prisma.liveGameData.findFirst({
        where: { gameId },
        orderBy: { timestamp: 'desc' },
      });

      if (!liveData) {
        return NextResponse.json({
          success: true,
          game: null,
          message: 'No live data available for this game',
        });
      }

      return NextResponse.json({ success: true, game: formatLiveGame(liveData) });
    } else {
      const where: any = {};
      if (sport) where.sport = sport;

      const liveGames = await prisma.liveGameData.findMany({
        where,
        orderBy: { timestamp: 'desc' },
        take: 100,
      });

      const gameMap = new Map<string, any>();
      liveGames.forEach(game => {
        if (!gameMap.has(game.gameId)) {
          gameMap.set(game.gameId, game);
        }
      });

      const uniqueGames = Array.from(gameMap.values());

      return NextResponse.json({
        success: true,
        games: uniqueGames.map(formatLiveGame),
        count: uniqueGames.length,
      });
    }
  } catch (error) {
    console.error('[Live] Games error:', error);
    return NextResponse.json({ error: 'Failed to fetch live games' }, { status: 500 });
  }
}

function formatLiveGame(liveData: any) {
  return {
    gameId: liveData.gameId,
    sport: liveData.sport,
    homeTeam: liveData.homeTeam,
    awayTeam: liveData.awayTeam,
    score: { home: liveData.homeScore, away: liveData.awayScore, total: liveData.homeScore + liveData.awayScore },
    gameState: { quarter: liveData.quarter, timeRemaining: liveData.timeRemaining, possession: liveData.possession },
    liveOdds: { spreadHome: liveData.liveSpreadHome, spreadAway: liveData.liveSpreadAway, moneylineHome: liveData.liveMoneylineHome, moneylineAway: liveData.liveMoneylineAway, totalLine: liveData.liveTotalLine },
    winProbability: { home: liveData.homeWinProb, away: liveData.awayWinProb },
    momentum: { score: liveData.momentumScore, indicator: liveData.momentumScore > 20 ? 'home' : liveData.momentumScore < -20 ? 'away' : 'neutral', recentDrives: liveData.recentDrives ? JSON.parse(liveData.recentDrives) : [] },
    recommendations: liveData.recommendations ? JSON.parse(liveData.recommendations) : [],
    lastUpdated: liveData.lastUpdated,
  };
}
