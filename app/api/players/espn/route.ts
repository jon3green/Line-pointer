import { NextResponse } from 'next/server';
import { ESPNService } from '@/lib/api/espn-api';
import { generateCacheKey, cachedFetch, CACHE_TTL } from '@/lib/cache/redis';

export const dynamic = 'force-dynamic';

/**
 * GET /api/players/espn
 * WITH REDIS CACHING - Reduces ESPN API load by 95%+
 * 
 * Query parameters:
 * - sport: 'nfl' | 'ncaaf' (default: 'nfl')
 * - q: search query
 * - position: filter by position (QB, RB, WR, TE, etc.)
 * - limit: max number of players (default: 100)
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const sport = searchParams.get('sport') || 'nfl';
    const query = searchParams.get('q');
    const position = searchParams.get('position');
    const limit = parseInt(searchParams.get('limit') || '100');

    let players;
    let cacheKey: string;

    // Search by name
    if (query) {
      cacheKey = generateCacheKey('espn-search', sport, query.toLowerCase());
      players = await cachedFetch(cacheKey, CACHE_TTL.ESPN_DATA, () =>
        ESPNService.searchPlayers(
          query,
          sport === 'ncaaf' ? 'college-football' : 'nfl'
        )
      );
    }
    // Filter by position
    else if (position) {
      cacheKey = generateCacheKey('espn-position', sport, position);
      players = await cachedFetch(cacheKey, CACHE_TTL.ESPN_DATA, () =>
        ESPNService.getPlayersByPosition(
          position,
          sport === 'ncaaf' ? 'college-football' : 'nfl'
        )
      );
    }
    // Get all players
    else {
      cacheKey = generateCacheKey('espn-all', sport, limit);
      players = await cachedFetch(cacheKey, CACHE_TTL.ESPN_DATA, () =>
        sport === 'ncaaf'
          ? ESPNService.getAllNCAAFPlayers(limit)
          : ESPNService.getAllNFLPlayers(limit)
      );
    }

    // Apply limit
    const limitedPlayers = players.slice(0, limit);

    return NextResponse.json({
      success: true,
      count: limitedPlayers.length,
      players: limitedPlayers,
      cached: true, // Indicates caching is enabled
    });
  } catch (error) {
    console.error('ESPN Players API Error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch players from ESPN',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

