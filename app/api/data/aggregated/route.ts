import { NextResponse } from 'next/server';
import DataAggregator from '@/lib/api/data-aggregator';

export const dynamic = 'force-dynamic';

/**
 * GET /api/data/aggregated
 * 
 * Get comprehensive aggregated data combining all sources
 * 
 * Query parameters:
 * - type: 'player' | 'game' (required)
 * - playerId: player ID (for player type)
 * - homeTeam: home team (for game type)
 * - awayTeam: away team (for game type)
 * - gameDate: game date ISO string (for game type)
 * - sport: 'nfl' | 'ncaaf' (default: 'nfl')
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const sport = (searchParams.get('sport') || 'nfl') as 'nfl' | 'ncaaf';

    if (!type || (type !== 'player' && type !== 'game')) {
      return NextResponse.json(
        { success: false, error: 'Invalid or missing type parameter. Use "player" or "game".' },
        { status: 400 }
      );
    }

    if (type === 'player') {
      const playerId = searchParams.get('playerId');
      if (!playerId) {
        return NextResponse.json(
          { success: false, error: 'playerId is required for player type' },
          { status: 400 }
        );
      }

      const data = await DataAggregator.aggregatePlayerData(playerId, sport);
      
      if (!data) {
        return NextResponse.json(
          { success: false, error: 'Player data not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({ success: true, data });
    }

    if (type === 'game') {
      const homeTeam = searchParams.get('homeTeam');
      const awayTeam = searchParams.get('awayTeam');
      const gameDateStr = searchParams.get('gameDate');

      if (!homeTeam || !awayTeam || !gameDateStr) {
        return NextResponse.json(
          { success: false, error: 'homeTeam, awayTeam, and gameDate are required for game type' },
          { status: 400 }
        );
      }

      const gameDate = new Date(gameDateStr);
      if (isNaN(gameDate.getTime())) {
        return NextResponse.json(
          { success: false, error: 'Invalid gameDate format. Use ISO 8601 format.' },
          { status: 400 }
        );
      }

      const data = await DataAggregator.aggregateGameData(homeTeam, awayTeam, gameDate, sport);

      if (!data) {
        return NextResponse.json(
          { success: false, error: 'Game data not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({ success: true, data });
    }

    return NextResponse.json(
      { success: false, error: 'Invalid request' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Aggregated data API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch aggregated data',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

