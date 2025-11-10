import { NextResponse } from 'next/server';
import { ESPNService } from '@/lib/api/espn-api';

/**
 * GET /api/players/espn/[id]
 * 
 * Get specific player details by ESPN ID
 * 
 * Query parameters:
 * - sport: 'nfl' | 'ncaaf' (default: 'nfl')
 */
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const sport = searchParams.get('sport') || 'nfl';

    const player = await ESPNService.getPlayer(
      params.id,
      sport === 'ncaaf' ? 'college-football' : 'nfl'
    );

    if (!player) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Player not found',
          playerId: params.id
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      player,
    });
  } catch (error) {
    console.error('ESPN Player Details API Error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch player details',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

