import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/**
 * GET - Get player prop predictions
 */
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const sport = searchParams.get('sport') || undefined;
    const propType = searchParams.get('propType') || undefined;
    const minConfidence = parseInt(searchParams.get('minConfidence') || '0');
    const limit = parseInt(searchParams.get('limit') || '50');

    // Get upcoming props
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const where: any = {
      gameTime: {
        gte: now,
        lte: tomorrow,
      },
    };
    if (sport) where.sport = sport;
    if (propType) where.propType = propType;
    if (minConfidence > 0) where.confidence = { gte: minConfidence };

    const props = await prisma.propPrediction.findMany({
      where,
      orderBy: [
        { confidence: 'desc' },
        { gameTime: 'asc' },
      ],
      take: limit,
    });

    // Group by game
    const propsByGame = new Map<string, any[]>();
    props.forEach(prop => {
      if (!propsByGame.has(prop.gameId)) {
        propsByGame.set(prop.gameId, []);
      }
      propsByGame.get(prop.gameId)!.push({
        id: prop.id,
        playerId: prop.playerId,
        playerName: prop.playerName,
        team: prop.team,
        position: prop.position,
        opponent: prop.opponent,
        propType: prop.propType,
        line: prop.line,
        prediction: prop.prediction,
        projectedValue: prop.projectedValue,
        confidence: prop.confidence,
        overOdds: prop.overOdds,
        underOdds: prop.underOdds,
        expectedValue: prop.expectedValue,
        factors: prop.factors ? JSON.parse(prop.factors) : null,
      });
    });

    const grouped = Array.from(propsByGame.entries()).map(([gameId, props]) => ({
      gameId,
      game: `${props[0].team} vs ${props[0].opponent}`,
      gameTime: props[0].gameTime,
      props,
    }));

    return NextResponse.json({
      success: true,
      predictions: grouped,
      total: props.length,
      filters: { sport, propType, minConfidence },
    });
  } catch (error) {
    console.error('[Props] Predictions error:', error);
    return NextResponse.json({ error: 'Failed to fetch prop predictions' }, { status: 500 });
  }
}
