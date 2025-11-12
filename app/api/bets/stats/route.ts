import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const sport = searchParams.get('sport') || undefined;
    const period = searchParams.get('period') || 'all_time'; // 'daily', 'weekly', 'monthly', 'all_time'

    // Build where clause
    const where: any = { userId: session.user.id };
    if (sport) where.sport = sport;

    // Add date filter for period
    if (period !== 'all_time') {
      const now = new Date();
      let startDate = new Date();
      if (period === 'daily') {
        startDate.setDate(now.getDate() - 1);
      } else if (period === 'weekly') {
        startDate.setDate(now.getDate() - 7);
      } else if (period === 'monthly') {
        startDate.setMonth(now.getMonth() - 1);
      }
      where.createdAt = { gte: startDate };
    }

    // Fetch all bets
    const allBets = await prisma.bet.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    // Calculate basic stats
    const totalBets = allBets.length;
    const wonBets = allBets.filter(b => b.status === 'won').length;
    const lostBets = allBets.filter(b => b.status === 'lost').length;
    const pushBets = allBets.filter(b => b.status === 'push').length;
    const pendingBets = allBets.filter(b => b.status === 'pending').length;

    const settledBets = wonBets + lostBets;
    const winRate = settledBets > 0 ? Math.round((wonBets / settledBets) * 1000) / 10 : 0;

    // Calculate financial stats
    const totalWagered = allBets.reduce((sum, bet) => sum + bet.stake, 0);
    const totalWon = allBets
      .filter(b => b.status === 'won')
      .reduce((sum, bet) => sum + bet.potentialWin, 0);
    const totalLost = allBets
      .filter(b => b.status === 'lost')
      .reduce((sum, bet) => sum + bet.stake, 0);
    const netProfit = totalWon - totalLost;
    const roi = totalWagered > 0 ? Math.round((netProfit / totalWagered) * 1000) / 10 : 0;

    // Find biggest win and loss
    const wonBetsList = allBets.filter(b => b.status === 'won');
    const lostBetsList = allBets.filter(b => b.status === 'lost');
    const biggestWin = wonBetsList.length > 0
      ? Math.max(...wonBetsList.map(b => b.potentialWin - b.stake))
      : 0;
    const biggestLoss = lostBetsList.length > 0
      ? Math.max(...lostBetsList.map(b => b.stake))
      : 0;

    // Calculate streaks
    const { currentStreak, bestWinStreak, worstLossStreak } = calculateStreaks(allBets);

    // Calculate stats by bet type
    const byBetType = calculateByBetType(allBets);

    // Calculate stats by sport
    const bySport = calculateBySport(allBets);

    return NextResponse.json({
      success: true,
      stats: {
        overall: {
          totalBets,
          wonBets,
          lostBets,
          pushBets,
          pendingBets,
          winRate,
          totalWagered: Math.round(totalWagered * 100) / 100,
          totalWon: Math.round(totalWon * 100) / 100,
          totalLost: Math.round(totalLost * 100) / 100,
          netProfit: Math.round(netProfit * 100) / 100,
          roi,
          biggestWin: Math.round(biggestWin * 100) / 100,
          biggestLoss: Math.round(biggestLoss * 100) / 100,
        },
        streaks: {
          current: currentStreak,
          bestWinStreak,
          worstLossStreak,
        },
        byBetType,
        bySport,
      },
      filters: { sport, period },
    });
  } catch (error) {
    console.error('[Bets] Stats error:', error);
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}

function calculateStreaks(bets: any[]) {
  const settledBets = bets
    .filter(b => b.status === 'won' || b.status === 'lost')
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  let currentStreak = 0;
  let bestWinStreak = 0;
  let worstLossStreak = 0;
  let tempStreak = 0;

  for (const bet of settledBets) {
    if (bet.status === 'won') {
      tempStreak = tempStreak >= 0 ? tempStreak + 1 : 1;
      bestWinStreak = Math.max(bestWinStreak, tempStreak);
    } else {
      tempStreak = tempStreak <= 0 ? tempStreak - 1 : -1;
      worstLossStreak = Math.min(worstLossStreak, tempStreak);
    }
  }

  currentStreak = tempStreak;

  return {
    currentStreak,
    bestWinStreak,
    worstLossStreak: Math.abs(worstLossStreak),
  };
}

function calculateByBetType(bets: any[]) {
  const types = ['spread', 'moneyline', 'total', 'prop'];
  return types.map(type => {
    const typeBets = bets.filter(b => b.betType === type);
    const won = typeBets.filter(b => b.status === 'won').length;
    const lost = typeBets.filter(b => b.status === 'lost').length;
    const settled = won + lost;
    const wagered = typeBets.reduce((sum, bet) => sum + bet.stake, 0);
    const profit = typeBets
      .filter(b => b.status === 'won')
      .reduce((sum, bet) => sum + bet.potentialWin, 0) -
      typeBets
      .filter(b => b.status === 'lost')
      .reduce((sum, bet) => sum + bet.stake, 0);

    return {
      betType: type,
      totalBets: typeBets.length,
      wonBets: won,
      lostBets: lost,
      winRate: settled > 0 ? Math.round((won / settled) * 1000) / 10 : 0,
      totalWagered: Math.round(wagered * 100) / 100,
      netProfit: Math.round(profit * 100) / 100,
      roi: wagered > 0 ? Math.round((profit / wagered) * 1000) / 10 : 0,
    };
  }).filter(stat => stat.totalBets > 0);
}

function calculateBySport(bets: any[]) {
  const sports = [...new Set(bets.map(b => b.sport))];
  return sports.map(sport => {
    const sportBets = bets.filter(b => b.sport === sport);
    const won = sportBets.filter(b => b.status === 'won').length;
    const lost = sportBets.filter(b => b.status === 'lost').length;
    const settled = won + lost;
    const wagered = sportBets.reduce((sum, bet) => sum + bet.stake, 0);
    const profit = sportBets
      .filter(b => b.status === 'won')
      .reduce((sum, bet) => sum + bet.potentialWin, 0) -
      sportBets
      .filter(b => b.status === 'lost')
      .reduce((sum, bet) => sum + bet.stake, 0);

    return {
      sport,
      totalBets: sportBets.length,
      wonBets: won,
      lostBets: lost,
      winRate: settled > 0 ? Math.round((won / settled) * 1000) / 10 : 0,
      totalWagered: Math.round(wagered * 100) / 100,
      netProfit: Math.round(profit * 100) / 100,
      roi: wagered > 0 ? Math.round((profit / wagered) * 1000) / 10 : 0,
    };
  });
}
