import { NextResponse } from 'next/server';
import { generatePropPredictions } from '@/lib/services/props-predictor';

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes

/**
 * Cron job to generate player prop predictions
 * Should run daily (morning before games)
 *
 * Vercel Cron: 0 10 * * * (10am daily)
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  const expectedAuth = `Bearer ${process.env.CRON_SECRET || 'dev-secret'}`;

  if (authHeader !== expectedAuth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    console.log('[Cron] Generating prop predictions...');
    const startTime = Date.now();

    const generated = await generatePropPredictions();

    const duration = Date.now() - startTime;

    console.log('[Cron] Prop predictions generated:', {
      count: generated,
      duration: `${duration}ms`,
    });

    return NextResponse.json({
      success: true,
      generated,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[Cron] Prop generation error:', error);
    return NextResponse.json(
      {
        error: 'Failed to generate prop predictions',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
