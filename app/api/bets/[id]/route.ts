import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// GET single bet by ID
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const bet = await prisma.bet.findUnique({
      where: {
        id: params.id,
        userId: session.user.id,
      },
      include: {
        game: {
          select: {
            homeTeam: true,
            awayTeam: true,
            gameTime: true,
            homeScore: true,
            awayScore: true,
            status: true,
          },
        },
      },
    });

    if (!bet) {
      return NextResponse.json({ error: 'Bet not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      bet,
    });
  } catch (error) {
    console.error('[Bet] GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch bet' }, { status: 500 });
  }
}

// PUT update bet (for notes, status, etc.)
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify bet ownership
    const existingBet = await prisma.bet.findUnique({
      where: {
        id: params.id,
        userId: session.user.id,
      },
    });

    if (!existingBet) {
      return NextResponse.json({ error: 'Bet not found' }, { status: 404 });
    }

    const body = await request.json();
    const { notes, status } = body;

    // Only allow updating certain fields
    const updateData: any = {};
    if (notes !== undefined) updateData.notes = notes;
    if (status !== undefined && ['pending', 'won', 'lost', 'push', 'canceled'].includes(status)) {
      updateData.status = status;
    }

    const updatedBet = await prisma.bet.update({
      where: { id: params.id },
      data: updateData,
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

    // If status changed to won/lost, create bankroll transaction
    if (status && status !== existingBet.status && (status === 'won' || status === 'lost')) {
      const currentBalance = await getCurrentBalance(session.user.id);
      const amount = status === 'won' ? updatedBet.potentialWin : 0;
      await prisma.bankrollTransaction.create({
        data: {
          userId: session.user.id,
          type: status === 'won' ? 'win' : 'loss',
          amount,
          balance: currentBalance + amount,
          betId: updatedBet.id,
          gameId: updatedBet.gameId,
          description: `Bet ${status}: ${updatedBet.betType} on ${updatedBet.selection}`,
          category: 'sports',
        },
      });
    }

    return NextResponse.json({
      success: true,
      bet: updatedBet,
      message: 'Bet updated successfully',
    });
  } catch (error) {
    console.error('[Bet] PUT error:', error);
    return NextResponse.json({ error: 'Failed to update bet' }, { status: 500 });
  }
}

// DELETE bet
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify bet ownership
    const bet = await prisma.bet.findUnique({
      where: {
        id: params.id,
        userId: session.user.id,
      },
    });

    if (!bet) {
      return NextResponse.json({ error: 'Bet not found' }, { status: 404 });
    }

    // Only allow deleting pending bets
    if (bet.status !== 'pending') {
      return NextResponse.json(
        { error: 'Cannot delete settled bets' },
        { status: 400 }
      );
    }

    // Delete the bet
    await prisma.bet.delete({
      where: { id: params.id },
    });

    // Refund the stake to bankroll
    const currentBalance = await getCurrentBalance(session.user.id);
    await prisma.bankrollTransaction.create({
      data: {
        userId: session.user.id,
        type: 'adjustment',
        amount: bet.stake,
        balance: currentBalance + bet.stake,
        betId: bet.id,
        gameId: bet.gameId,
        description: `Bet canceled: ${bet.betType} on ${bet.selection}`,
        category: 'sports',
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Bet deleted successfully',
    });
  } catch (error) {
    console.error('[Bet] DELETE error:', error);
    return NextResponse.json({ error: 'Failed to delete bet' }, { status: 500 });
  }
}

// Helper function
async function getCurrentBalance(userId: string): Promise<number> {
  const lastTransaction = await prisma.bankrollTransaction.findFirst({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    select: { balance: true },
  });
  return lastTransaction?.balance || 0;
}
