import { NextResponse } from 'next/server';
import { getBetTimingRecommendation } from '@/lib/services/bet-timing';

export const dynamic = 'force-dynamic';

/**
 * GET /api/betting/timing/[gameId]
 * Get bet timing recommendation for a specific game
 */
export async function GET(
  request: Request,
  { params }: { params: { gameId: string } }
) {
  try {
    const { gameId } = params;
    const { searchParams } = new URL(request.url);
    const externalGameId = searchParams.get('externalGameId') || undefined;

    const recommendation = await getBetTimingRecommendation(gameId, externalGameId);

    if (!recommendation) {
      return NextResponse.json({
        success: false,
        message: 'No timing data available for this game',
        data: null,
      });
    }

    return NextResponse.json({
      success: true,
      data: recommendation,
    });
  } catch (error) {
    console.error('[API] Error fetching bet timing:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get timing recommendation',
      },
      { status: 500 }
    );
  }
}
