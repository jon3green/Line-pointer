import { NextResponse } from 'next/server';
import { fetchRealTimeOdds, processOddsData, getAPIUsage } from '@/lib/api/odds-api';
import { Sport } from '@/lib/types';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

/**
 * GET /api/odds/realtime
 * Fetch real-time odds from The Odds API
 *
 * Query params:
 * - sport: 'NFL' | 'NCAAF' | 'TABLE_TENNIS'
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const sport = searchParams.get('sport') as Sport || 'NFL';

    // Fetch real-time odds
    const oddsData = await fetchRealTimeOdds(sport);

    // Process odds into our format
    const processedOdds = oddsData
      .map(game => ({
        gameId: game.id,
        homeTeam: game.home_team,
        awayTeam: game.away_team,
        commenceTime: game.commence_time,
        odds: processOddsData(game),
      }))
      .filter(game => game.odds !== null);

    // Get API usage stats
    const usage = await getAPIUsage();

    return NextResponse.json({
      success: true,
      sport,
      games: processedOdds,
      count: processedOdds.length,
      apiUsage: usage,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error fetching real-time odds:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch odds',
      },
      { status: 500 }
    );
  }
}
