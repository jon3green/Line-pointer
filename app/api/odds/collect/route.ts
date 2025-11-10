import { NextResponse } from 'next/server';
import { collectAllOdds, collectOddsForSport } from '@/lib/services/odds-collection';
import { Sport } from '@/lib/types';

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes max for serverless

/**
 * POST /api/odds/collect
 * Manually trigger odds collection
 *
 * Body:
 * - sport: 'NFL' | 'NCAAF' | 'all' (optional, defaults to 'all')
 */
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const sport = body.sport || 'all';

    if (sport === 'all') {
      const results = await collectAllOdds();

      return NextResponse.json({
        success: true,
        message: 'Odds collection completed',
        results,
        timestamp: new Date().toISOString(),
      });
    } else if (sport === 'NFL' || sport === 'NCAAF' || sport === 'TABLE_TENNIS') {
      const result = await collectOddsForSport(sport as Sport);

      return NextResponse.json({
        success: true,
        message: `Odds collection completed for ${sport}`,
        result,
        timestamp: new Date().toISOString(),
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid sport. Must be NFL, NCAAF, TABLE_TENNIS, or all',
        },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error collecting odds:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to collect odds',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/odds/collect
 * Get collection status and last run time
 */
export async function GET() {
  try {
    // Could add logic to track last collection time
    return NextResponse.json({
      success: true,
      message: 'Use POST to trigger collection',
      endpoint: '/api/odds/collect',
      methods: {
        POST: {
          description: 'Trigger odds collection',
          body: {
            sport: 'NFL | NCAAF | TABLE_TENNIS | all (optional, default: all)',
          },
        },
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
