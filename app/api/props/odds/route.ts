import { NextResponse } from 'next/server';
import { getAllPlayerProps, getPlayerProps } from '@/lib/api/player-props-odds';
import { cachePlayerProps, cacheAllPlayerProps } from '@/lib/cache/redis';

export const dynamic = 'force-dynamic';

/**
 * GET /api/props/odds
 * 
 * Get player props from The Odds API (includes Hard Rock Bet)
 * WITH REDIS CACHING - Reduces API calls by 90%+
 * 
 * Query parameters:
 * - sport: 'nfl' | 'ncaaf' (default: 'nfl')
 * - player: player name to filter (optional)
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const sport = (searchParams.get('sport') || 'nfl') as 'nfl' | 'ncaaf';
    const playerName = searchParams.get('player');

    let result;

    if (playerName) {
      // Cache individual player props for 5 minutes
      result = await cachePlayerProps(sport, playerName, () => 
        getPlayerProps(playerName, sport)
      );
    } else {
      // Cache all props for 5 minutes
      result = await cacheAllPlayerProps(sport, () =>
        getAllPlayerProps(sport)
      );
    }

    if (!result.success) {
      return NextResponse.json(
        { 
          success: false,
          error: result.error || 'Failed to fetch player props',
          props: [],
          count: 0,
        },
        { status: 500 }
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Player props API error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
        props: [],
        count: 0,
      },
      { status: 500 }
    );
  }
}

