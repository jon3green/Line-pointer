import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const gameId = searchParams.get('gameId');
    const hours = parseInt(searchParams.get('hours') || '24');

    if (!gameId) {
      return NextResponse.json(
        { error: 'gameId is required' },
        { status: 400 }
      );
    }

    // Calculate time range
    const since = new Date();
    since.setHours(since.getHours() - hours);

    const history = await prisma.oddsHistory.findMany({
      where: {
        OR: [
          { gameId },
          { externalGameId: gameId },
        ],
        timestamp: {
          gte: since,
        },
      },
      orderBy: {
        timestamp: 'asc',
      },
    });

    if (history.length === 0) {
      return NextResponse.json({
        success: true,
        history: [],
        message: 'No odds history found for this game'
      });
    }

    // Calculate movement vs opening
    const opening = history[0];
    const current = history[history.length - 1];

    const movements = {
      spread: current.spread && opening.spread 
        ? current.spread - opening.spread 
        : null,
      total: current.total && opening.total 
        ? current.total - opening.total 
        : null,
      homeML: current.homeML && opening.homeML 
        ? current.homeML - opening.homeML 
        : null,
      awayML: current.awayML && opening.awayML 
        ? current.awayML - opening.awayML 
        : null,
    };

    return NextResponse.json({
      success: true,
      history,
      opening,
      current,
      movements,
      dataPoints: history.length
    });
  } catch (error) {
    console.error('Get odds history error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch odds history' },
      { status: 500 }
    );
  }
}
