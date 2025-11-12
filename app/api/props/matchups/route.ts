import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { analyzePlayerMatchup } from '@/lib/services/props-predictor';

export const dynamic = 'force-dynamic';

/**
 * GET - Analyze player matchup
 */
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const playerId = searchParams.get('playerId');
    const gameId = searchParams.get('gameId');

    if (!playerId || !gameId) {
      return NextResponse.json(
        { error: 'playerId and gameId required' },
        { status: 400 }
      );
    }

    // Get player props for this game
    const props = await prisma.propPrediction.findMany({
      where: {
        playerId,
        gameId,
      },
    });

    if (props.length === 0) {
      return NextResponse.json({
        success: true,
        matchup: null,
        message: 'No props found for this player/game',
      });
    }

    // Analyze matchup
    const analysis = await analyzePlayerMatchup(playerId, gameId);

    return NextResponse.json({
      success: true,
      matchup: {
        playerId,
        playerName: props[0].playerName,
        team: props[0].team,
        position: props[0].position,
        opponent: props[0].opponent,
        gameTime: props[0].gameTime,
        props: props.map(p => ({
          propType: p.propType,
          line: p.line,
          prediction: p.prediction,
          projectedValue: p.projectedValue,
          confidence: p.confidence,
        })),
        analysis,
      },
    });
  } catch (error) {
    console.error('[Props] Matchup error:', error);
    return NextResponse.json({ error: 'Failed to analyze matchup' }, { status: 500 });
  }
}
