import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { analyzeFactorCorrelations } from '@/lib/services/prediction-tracker';

export const dynamic = 'force-dynamic';

/**
 * GET /api/accuracy/factors
 *
 * Analyze which prediction factors correlate with accuracy
 * This is the ML feedback loop - shows which factors lead to correct predictions
 *
 * Returns:
 * - Overall accuracy baseline
 * - All factors sorted by accuracy
 * - Strong positive factors (better than baseline)
 * - Weak factors (worse than baseline)
 * - Insights and recommendations
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
    const minSampleSize = searchParams.get('minSampleSize')
      ? parseInt(searchParams.get('minSampleSize')!)
      : 20;

    console.log('[Accuracy] Analyzing factor correlations:', { sport, minSampleSize });

    const analysis = await analyzeFactorCorrelations({
      sport,
      minSampleSize,
    });

    // Check for insufficient data
    if ('error' in analysis) {
      return NextResponse.json({
        success: false,
        error: analysis.error,
        sampleSize: analysis.sampleSize,
        minRequired: analysis.minRequired,
        message: `Need at least ${analysis.minRequired} predictions to analyze factors. Currently have ${analysis.sampleSize}.`,
      });
    }

    return NextResponse.json({
      success: true,
      analysis,
      filters: { sport, minSampleSize },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[Accuracy] Error analyzing factors:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to analyze factors',
      },
      { status: 500 }
    );
  }
}
