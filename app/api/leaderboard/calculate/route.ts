import { NextResponse } from 'next/server';
import { calculateLeaderboards } from '@/lib/services/leaderboard-calculator';

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes

/**
 * Cron job to calculate/update leaderboards
 * Should run daily
 *
 * Vercel Cron: 0 6 * * * (6am daily)
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  const expectedAuth = `Bearer ${process.env.CRON_SECRET || 'dev-secret'}`;

  if (authHeader !== expectedAuth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    console.log('[Cron] Starting leaderboard calculations...');
    const startTime = Date.now();

    const result = await calculateLeaderboards();

    const duration = Date.now() - startTime;

    console.log('[Cron] Leaderboard calculations completed:', {
      leaderboards: result.leaderboardsCreated,
      userStats: result.userStatsUpdated,
      duration: `${duration}ms`,
    });

    return NextResponse.json({
      success: true,
      leaderboardsCreated: result.leaderboardsCreated,
      userStatsUpdated: result.userStatsUpdated,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[Cron] Leaderboard calculation error:', error);
    return NextResponse.json(
      {
        error: 'Failed to calculate leaderboards',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
