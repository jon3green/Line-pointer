import { NextResponse } from 'next/server';
import { collectAllOdds } from '@/lib/services/odds-collection';

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes

/**
 * GET /api/cron/collect-odds
 * Cron endpoint for collecting odds every 5 minutes
 *
 * This endpoint is called by Vercel Cron Jobs
 * Configure in vercel.json with cron schedule
 */
export async function GET(request: Request) {
  try {
    // Verify cron secret to prevent unauthorized access
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('[Cron] Starting odds collection:', new Date().toISOString());

    const results = await collectAllOdds();

    const totalGames = results.reduce((sum, r) => sum + r.gamesProcessed, 0);
    const totalSnapshots = results.reduce((sum, r) => sum + r.oddsSnapshotsSaved, 0);
    const totalAlerts = results.reduce((sum, r) => sum + r.alertsCreated, 0);
    const totalErrors = results.reduce((sum, r) => sum + r.errors.length, 0);

    console.log('[Cron] Odds collection completed:', {
      totalGames,
      totalSnapshots,
      totalAlerts,
      totalErrors,
    });

    return NextResponse.json({
      success: true,
      message: 'Odds collection completed',
      summary: {
        totalGames,
        totalSnapshots,
        totalAlerts,
        totalErrors,
      },
      results,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[Cron] Error collecting odds:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to collect odds',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/cron/collect-odds
 * Alternative method for manual triggering
 */
export async function POST(request: Request) {
  return GET(request);
}
