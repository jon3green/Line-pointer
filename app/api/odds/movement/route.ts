import { NextResponse } from 'next/server';
import { detectLineMovement } from '@/lib/api/odds-api';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/**
 * GET /api/odds/movement
 * Detect and analyze line movements for games
 *
 * Query params:
 * - gameId: specific game to check
 * - sport: filter by sport
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const gameId = searchParams.get('gameId');
    const sport = searchParams.get('sport');

    if (!gameId) {
      return NextResponse.json(
        { success: false, error: 'gameId is required' },
        { status: 400 }
      );
    }

    // In production: Query historical odds from database
    // For now, return placeholder structure
    const movement = {
      gameId,
      hasMovement: false,
      message: 'Line movement tracking will be available once historical odds data is collected',
      note: 'System will automatically track odds every 5 minutes starting now',
    };

    return NextResponse.json({
      success: true,
      movement,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error detecting line movement:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to detect movement',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/odds/movement
 * Manually trigger line movement analysis
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { gameId, currentOdds } = body;

    if (!gameId || !currentOdds) {
      return NextResponse.json(
        { success: false, error: 'gameId and currentOdds are required' },
        { status: 400 }
      );
    }

    // Detect line movement
    const movement = await detectLineMovement(gameId, currentOdds);

    return NextResponse.json({
      success: true,
      movement,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error analyzing line movement:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to analyze movement',
      },
      { status: 500 }
    );
  }
}
