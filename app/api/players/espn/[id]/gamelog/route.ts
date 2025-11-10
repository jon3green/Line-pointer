import { NextResponse } from 'next/server';
import { ESPNService } from '@/lib/api/espn-api';

/**
 * GET /api/players/espn/[id]/gamelog
 * 
 * Get player game log (season stats by game)
 * 
 * Query parameters:
 * - season: year (default: 2024)
 */
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const season = searchParams.get('season') || '2024';

    const gameLog = await ESPNService.getPlayerGameLog(params.id, season);

    return NextResponse.json({
      success: true,
      playerId: params.id,
      season,
      games: gameLog,
    });
  } catch (error) {
    console.error('ESPN Game Log API Error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch game log',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

