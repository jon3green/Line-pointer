import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { optimizeParlay, calculateCorrelation } from '@/lib/services/parlay-optimizer';

export const dynamic = 'force-dynamic';

/**
 * POST - Optimize a parlay
 * Takes a list of legs and returns correlation analysis and EV calculation
 */
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { legs, stake } = body;

    // Validate legs array
    if (!Array.isArray(legs) || legs.length < 2) {
      return NextResponse.json(
        { error: 'At least 2 legs required for a parlay' },
        { status: 400 }
      );
    }

    // Optimize the parlay
    const optimization = await optimizeParlay(legs, stake || 10);

    return NextResponse.json({
      success: true,
      optimization,
    });
  } catch (error) {
    console.error('[Parlay] Optimize error:', error);
    return NextResponse.json({ error: 'Failed to optimize parlay' }, { status: 500 });
  }
}
