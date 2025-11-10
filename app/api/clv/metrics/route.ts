import { NextResponse } from 'next/server';
import { calculateCLVMetrics } from '@/lib/services/clv-tracker';

export const dynamic = 'force-dynamic';

/**
 * GET /api/clv/metrics
 * Get CLV metrics for a sport/timeframe
 *
 * Query params:
 * - sport: 'NFL' | 'NCAAF' (optional)
 * - startDate: ISO date string (optional)
 * - endDate: ISO date string (optional)
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const sport = searchParams.get('sport') || undefined;
    const startDate = searchParams.get('startDate')
      ? new Date(searchParams.get('startDate')!)
      : undefined;
    const endDate = searchParams.get('endDate')
      ? new Date(searchParams.get('endDate')!)
      : undefined;

    const metrics = await calculateCLVMetrics(sport, startDate, endDate);

    if (!metrics) {
      return NextResponse.json(
        { success: false, error: 'Failed to calculate CLV metrics' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: metrics,
      filters: {
        sport: sport || 'all',
        startDate: startDate?.toISOString() || null,
        endDate: endDate?.toISOString() || null,
      },
    });
  } catch (error) {
    console.error('[API] Error fetching CLV metrics:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch CLV metrics',
      },
      { status: 500 }
    );
  }
}
