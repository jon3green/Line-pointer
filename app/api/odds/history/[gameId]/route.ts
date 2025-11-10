import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/**
 * GET /api/odds/history/[gameId]
 * Fetches complete odds history for a specific game
 * Used for line movement charts and trend analysis
 */
export async function GET(
  request: Request,
  { params }: { params: { gameId: string } }
) {
  try {
    const { gameId } = params;

    if (!gameId) {
      return NextResponse.json(
        { success: false, error: 'Game ID is required' },
        { status: 400 }
      );
    }

    // Fetch all odds history for this game
    const oddsHistory = await prisma.oddsHistory.findMany({
      where: {
        OR: [
          { gameId: gameId },
          { externalGameId: gameId },
        ],
      },
      orderBy: {
        timestamp: 'asc',
      },
    });

    if (oddsHistory.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No odds history found for this game',
        data: {
          gameId,
          snapshots: [],
          summary: {
            totalSnapshots: 0,
            firstSnapshot: null,
            lastSnapshot: null,
            spreadMovement: 0,
            totalMovement: 0,
          },
        },
      });
    }

    // Calculate summary statistics
    const firstSnapshot = oddsHistory[0];
    const lastSnapshot = oddsHistory[oddsHistory.length - 1];

    const spreadMovement =
      firstSnapshot.spread && lastSnapshot.spread
        ? lastSnapshot.spread - firstSnapshot.spread
        : 0;

    const totalMovement =
      firstSnapshot.total && lastSnapshot.total
        ? lastSnapshot.total - firstSnapshot.total
        : 0;

    // Group by bookmaker for multi-line charts
    const byBookmaker = oddsHistory.reduce((acc, snapshot) => {
      if (!acc[snapshot.bookmaker]) {
        acc[snapshot.bookmaker] = [];
      }
      acc[snapshot.bookmaker].push(snapshot);
      return acc;
    }, {} as Record<string, typeof oddsHistory>);

    // Calculate line movement indicators
    const significantMoves = oddsHistory.filter(s => s.isSignificantMove).length;
    const steamMoves = oddsHistory.filter(s => s.isSteamMove).length;
    const rlmOccurrences = oddsHistory.filter(s => s.isRLM).length;
    const sharpMoneyIndicators = oddsHistory.filter(s => s.sharpMoney).length;

    return NextResponse.json({
      success: true,
      data: {
        gameId,
        homeTeam: lastSnapshot.homeTeam,
        awayTeam: lastSnapshot.awayTeam,
        gameTime: lastSnapshot.gameTime,
        sport: lastSnapshot.sport,
        snapshots: oddsHistory.map(snapshot => ({
          id: snapshot.id,
          timestamp: snapshot.timestamp,
          bookmaker: snapshot.bookmaker,
          // Spread data
          spread: snapshot.spread,
          spreadHomeOdds: snapshot.spreadHomeOdds,
          spreadAwayOdds: snapshot.spreadAwayOdds,
          spreadMovement: snapshot.spreadMovement,
          // Total data
          total: snapshot.total,
          overOdds: snapshot.overOdds,
          underOdds: snapshot.underOdds,
          totalMovement: snapshot.totalMovement,
          // Moneyline data
          homeML: snapshot.homeML,
          awayML: snapshot.awayML,
          mlMovement: snapshot.mlMovement,
          // Indicators
          isSignificantMove: snapshot.isSignificantMove,
          isSteamMove: snapshot.isSteamMove,
          isRLM: snapshot.isRLM,
          sharpMoney: snapshot.sharpMoney,
        })),
        byBookmaker,
        summary: {
          totalSnapshots: oddsHistory.length,
          bookmakers: Object.keys(byBookmaker),
          firstSnapshot: firstSnapshot.timestamp,
          lastSnapshot: lastSnapshot.timestamp,
          openingSpread: firstSnapshot.spread,
          currentSpread: lastSnapshot.spread,
          spreadMovement,
          openingTotal: firstSnapshot.total,
          currentTotal: lastSnapshot.total,
          totalMovement,
          // Movement indicators
          significantMoves,
          steamMoves,
          rlmOccurrences,
          sharpMoneyIndicators,
          // Volatility score (based on number of moves)
          volatilityScore: Math.min(
            100,
            (significantMoves * 10) + (steamMoves * 20) + (rlmOccurrences * 15)
          ),
        },
      },
    });
  } catch (error) {
    console.error('[API] Error fetching odds history:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch odds history',
      },
      { status: 500 }
    );
  }
}
