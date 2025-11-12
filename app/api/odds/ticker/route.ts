import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    // Get all games happening today or in the next 7 days
    const now = new Date();
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 7);

    // Fetch recent odds for each game
    const recentOdds = await prisma.oddsHistory.findMany({
      where: {
        timestamp: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
        },
      },
      orderBy: {
        timestamp: 'desc',
      },
    });

    // Group by game and get opening vs current
    const gameOddsMap = new Map<string, any>();

    for (const odds of recentOdds) {
      const gameKey = odds.gameId || odds.externalGameId;
      if (!gameKey) continue;

      if (!gameOddsMap.has(gameKey)) {
        gameOddsMap.set(gameKey, {
          current: odds,
          opening: odds,
          allOdds: [odds],
        });
      } else {
        const existing = gameOddsMap.get(gameKey);
        existing.allOdds.push(odds);
        // Keep track of oldest (opening) odds
        if (new Date(odds.timestamp) < new Date(existing.opening.timestamp)) {
          existing.opening = odds;
        }
      }
    }

    // Format for ticker
    const games = Array.from(gameOddsMap.entries()).map(([gameId, data]) => {
      const current = data.current;
      const opening = data.opening;

      return {
        id: gameId,
        homeTeam: current.homeTeam || 'Home',
        awayTeam: current.awayTeam || 'Away',
        homeAbbr: current.homeTeam?.substring(0, 3).toUpperCase() || 'HOM',
        awayAbbr: current.awayTeam?.substring(0, 3).toUpperCase() || 'AWY',
        spread: current.spread,
        spreadMovement:
          current.spread && opening.spread
            ? current.spread - opening.spread
            : null,
        total: current.total,
        totalMovement:
          current.total && opening.total
            ? current.total - opening.total
            : null,
        homeML: current.homeML,
        league: current.league || 'NFL',
      };
    });

    // Limit to 20 games max for ticker
    const tickerGames = games.slice(0, 20);

    return NextResponse.json({
      success: true,
      games: tickerGames,
      count: tickerGames.length,
    });
  } catch (error) {
    console.error('Ticker API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch ticker data', games: [] },
      { status: 500 }
    );
  }
}
