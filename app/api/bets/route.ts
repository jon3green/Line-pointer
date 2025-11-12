import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// GET all bets for the authenticated user
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const sport = searchParams.get('sport') || undefined;
    const status = searchParams.get('status') || undefined;
    const betType = searchParams.get('betType') || undefined;
    const limit = parseInt(searchParams.get('limit') || '100');

    const where: any = { userId: session.user.id };
    if (sport) where.sport = sport;
    if (status) where.status = status;
    if (betType) where.betType = betType;

    const bets = await prisma.bet.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        game: {
          select: {
            homeTeam: true,
            awayTeam: true,
            gameTime: true,
            homeScore: true,
            awayScore: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      bets,
      count: bets.length,
    });
  } catch (error) {
    console.error('[Bets] GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch bets' }, { status: 500 });
  }
}

// POST create a new bet
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      gameId,
      sport,
      betType,
      selection,
      odds,
      stake,
      potentialWin,
      line,
      bookmaker,
      notes,
    } = body;

    // Validate required fields
    if (!gameId || !sport || !betType || !selection || !odds || !stake) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create bet
    const bet = await prisma.bet.create({
      data: {
        userId: session.user.id,
        gameId,
        sport,
        betType,
        selection,
        odds,
        stake,
        potentialWin: potentialWin || stake * (odds > 0 ? odds / 100 : Math.abs(100 / odds)),
        line: line || null,
        bookmaker: bookmaker || null,
        notes: notes || null,
        status: 'pending',
      },
      include: {
        game: {
          select: {
            homeTeam: true,
            awayTeam: true,
            gameTime: true,
          },
        },
      },
    });

    // Create bankroll transaction
    const currentBalance = await getCurrentBalance(session.user.id);
    await prisma.bankrollTransaction.create({
      data: {
        userId: session.user.id,
        type: 'bet',
        amount: -stake,
        balance: currentBalance - stake,
        betId: bet.id,
        gameId,
        description: `Bet placed: ${betType} on ${selection}`,
        category: 'sports',
      },
    });

    return NextResponse.json({
      success: true,
      bet,
      message: 'Bet created successfully',
    });
  } catch (error) {
    console.error('[Bets] POST error:', error);
    return NextResponse.json({ error: 'Failed to create bet' }, { status: 500 });
  }
}

// Helper function to get current balance
async function getCurrentBalance(userId: string): Promise<number> {
  const lastTransaction = await prisma.bankrollTransaction.findFirst({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    select: { balance: true },
  });
  return lastTransaction?.balance || 0;
}
