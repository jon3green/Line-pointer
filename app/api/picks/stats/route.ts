import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;

    // Fetch all user's settled bets
    const bets = await prisma.bet.findMany({
      where: {
        userId,
        status: { in: ['won', 'lost', 'pushed'] },
      },
    });

    const pending = await prisma.bet.count({
      where: {
        userId,
        status: 'pending',
      },
    });

    // Calculate statistics
    const totalBets = bets.length;
    const wonBets = bets.filter((b) => b.status === 'won').length;
    const lostBets = bets.filter((b) => b.status === 'lost').length;
    const pushedBets = bets.filter((b) => b.status === 'pushed').length;

    const winRate = totalBets > 0 ? (wonBets / totalBets) * 100 : 0;

    const totalStaked = bets.reduce((sum, bet) => sum + bet.stake, 0);
    const totalWon = bets
      .filter((b) => b.status === 'won')
      .reduce((sum, bet) => sum + bet.potentialWin, 0);
    const totalLost = bets
      .filter((b) => b.status === 'lost')
      .reduce((sum, bet) => sum + bet.stake, 0);

    const profit = totalWon - totalLost;
    const roi = totalStaked > 0 ? (profit / totalStaked) * 100 : 0;

    // Group by sport
    const bySport: Record<string, { wins: number; losses: number; total: number }> = {};
    bets.forEach((bet) => {
      if (!bySport[bet.sport]) {
        bySport[bet.sport] = { wins: 0, losses: 0, total: 0 };
      }
      bySport[bet.sport].total++;
      if (bet.status === 'won') bySport[bet.sport].wins++;
      if (bet.status === 'lost') bySport[bet.sport].losses++;
    });

    // Group by bet type
    const byBetType: Record<string, { wins: number; losses: number; total: number }> = {};
    bets.forEach((bet) => {
      if (!byBetType[bet.betCategory]) {
        byBetType[bet.betCategory] = { wins: 0, losses: 0, total: 0 };
      }
      byBetType[bet.betCategory].total++;
      if (bet.status === 'won') byBetType[bet.betCategory].wins++;
      if (bet.status === 'lost') byBetType[bet.betCategory].losses++;
    });

    // Recent form (last 10 bets)
    const recentBets = bets.slice(-10);
    const recentForm = recentBets.map((bet) => bet.status);

    // Best streak
    let currentStreak = 0;
    let bestStreak = 0;
    for (let i = bets.length - 1; i >= 0; i--) {
      if (bets[i].status === 'won') {
        currentStreak++;
        bestStreak = Math.max(bestStreak, currentStreak);
      } else if (bets[i].status === 'lost') {
        currentStreak = 0;
      }
    }

    return NextResponse.json({
      success: true,
      stats: {
        totalBets,
        wonBets,
        lostBets,
        pushedBets,
        pending,
        winRate: Number(winRate.toFixed(2)),
        totalStaked: Number(totalStaked.toFixed(2)),
        totalWon: Number(totalWon.toFixed(2)),
        totalLost: Number(totalLost.toFixed(2)),
        profit: Number(profit.toFixed(2)),
        roi: Number(roi.toFixed(2)),
        bySport,
        byBetType,
        recentForm,
        currentStreak,
        bestStreak,
      },
    });
  } catch (error) {
    console.error('Fetch pick stats error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch statistics' },
      { status: 500 }
    );
  }
}
