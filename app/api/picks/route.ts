import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET - Fetch user's picks
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status'); // pending, won, lost, pushed
    const limit = parseInt(searchParams.get('limit') || '50');

    const where: any = {
      userId: (session.user as any).id,
    };

    if (status) {
      where.status = status;
    }

    const picks = await prisma.bet.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return NextResponse.json({ success: true, picks });
  } catch (error) {
    console.error('Fetch picks error:', error);
    return NextResponse.json({ error: 'Failed to fetch picks' }, { status: 500 });
  }
}

// POST - Submit a new pick
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      betType,
      sport,
      stake,
      odds,
      gameId,
      playerName,
      teamName,
      betCategory,
      selection,
    } = body;

    if (!betType || !sport || !stake || !odds || !betCategory || !selection) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Calculate potential win
    const potentialWin = calculatePotentialWin(stake, odds);

    const pick = await prisma.bet.create({
      data: {
        userId: (session.user as any).id,
        betType,
        sport,
        stake,
        odds,
        potentialWin,
        gameId,
        playerName,
        teamName,
        betCategory,
        selection,
        status: 'pending',
      },
    });

    return NextResponse.json({ success: true, pick }, { status: 201 });
  } catch (error) {
    console.error('Submit pick error:', error);
    return NextResponse.json(
      { error: 'Failed to submit pick' },
      { status: 500 }
    );
  }
}

// Helper function to calculate potential win from American odds
function calculatePotentialWin(stake: number, americanOdds: number): number {
  if (americanOdds > 0) {
    // Positive odds (underdog)
    return stake * (americanOdds / 100);
  } else {
    // Negative odds (favorite)
    return stake * (100 / Math.abs(americanOdds));
  }
}
