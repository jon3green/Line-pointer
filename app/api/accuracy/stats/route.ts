import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import {
  getPredictionStats,
  analyzeFactorCorrelations,
  exportTrainingData,
} from '@/lib/services/prediction-tracker';

export const dynamic = 'force-dynamic';

/**
 * GET /api/accuracy/stats
 *
 * Get comprehensive prediction accuracy statistics
 * Includes:
 * - Overall accuracy, precision, recall
 * - Accuracy by confidence range
 * - Accuracy by sport
 * - Recent performance trends (last 10, 25, 50 predictions)
 * - CLV metrics
 */
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const sport = searchParams.get('sport') || undefined;
    const startDate = searchParams.get('startDate')
      ? new Date(searchParams.get('startDate')!)
      : undefined;
    const endDate = searchParams.get('endDate')
      ? new Date(searchParams.get('endDate')!)
      : undefined;
    const minConfidence = searchParams.get('minConfidence')
      ? parseFloat(searchParams.get('minConfidence')!)
      : undefined;

    console.log('[Accuracy] Fetching prediction stats:', {
      sport,
      startDate,
      endDate,
      minConfidence,
    });

    // Get comprehensive stats
    const stats = await getPredictionStats({
      sport,
      startDate,
      endDate,
      minConfidence,
    });

    return NextResponse.json({
      success: true,
      stats,
      filters: { sport, startDate, endDate, minConfidence },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[Accuracy] Error fetching stats:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch accuracy stats',
      },
      { status: 500 }
    );
  }
}
