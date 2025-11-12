import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { analyzeCorrelations } from '@/lib/services/parlay-optimizer';

export const dynamic = 'force-dynamic';

/**
 * POST - Analyze correlations in a parlay
 * Identifies correlated legs that reduce true probability
 */
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { legs } = body;

    // Validate legs array
    if (!Array.isArray(legs) || legs.length < 2) {
      return NextResponse.json(
        { error: 'At least 2 legs required for correlation analysis' },
        { status: 400 }
      );
    }

    // Analyze correlations
    const analysis = await analyzeCorrelations(legs);

    return NextResponse.json({
      success: true,
      analysis,
    });
  } catch (error) {
    console.error('[Parlay] Analyze error:', error);
    return NextResponse.json({ error: 'Failed to analyze parlay' }, { status: 500 });
  }
}
