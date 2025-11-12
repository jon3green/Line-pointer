import { NextResponse } from 'next/server';
import { runAlertChecks } from '@/lib/services/alert-rules-engine';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/**
 * Cron job to check for alert triggers
 * Should run every 5 minutes
 *
 * Vercel Cron: */5 * * * *
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  const expectedAuth = `Bearer ${process.env.CRON_SECRET || 'dev-secret'}`;

  if (authHeader !== expectedAuth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    console.log('[Cron] Starting alert checks...');
    const startTime = Date.now();

    const result = await runAlertChecks();

    const duration = Date.now() - startTime;

    console.log('[Cron] Alert checks completed:', {
      checked: result.checked,
      queued: result.queued,
      duration: `${duration}ms`,
    });

    return NextResponse.json({
      success: true,
      checked: result.checked,
      queued: result.queued,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[Cron] Alert check error:', error);
    return NextResponse.json(
      {
        error: 'Failed to check alerts',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
