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
    const period = searchParams.get('period') || 'all_time'; // 'daily', 'weekly', 'monthly', 'all_time'

    // Get date range for period
    const { startDate, endDate } = getPeriodDates(period);

    const where: any = {
      userId: session.user.id,
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    };

    // Get all transactions in period
    const transactions = await prisma.bankrollTransaction.findMany({
      where,
      orderBy: { createdAt: 'asc' },
    });

    // Get current balance
    const lastTransaction = await prisma.bankrollTransaction.findFirst({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
      select: { balance: true },
    });
    const currentBalance = lastTransaction?.balance || 0;

    // Calculate metrics
    const deposits = transactions.filter(t => t.type === 'deposit');
    const withdrawals = transactions.filter(t => t.type === 'withdrawal');
    const bets = transactions.filter(t => t.type === 'bet');
    const wins = transactions.filter(t => t.type === 'win');
    const losses = transactions.filter(t => t.type === 'loss');

    const totalDeposits = deposits.reduce((sum, t) => sum + t.amount, 0);
    const totalWithdrawals = Math.abs(withdrawals.reduce((sum, t) => sum + t.amount, 0));
    const totalWagered = Math.abs(bets.reduce((sum, t) => sum + t.amount, 0));
    const totalWon = wins.reduce((sum, t) => sum + t.amount, 0);
    const totalLost = Math.abs(losses.reduce((sum, t) => sum + t.amount, 0));
    const netProfit = totalWon - totalLost;

    // Calculate ROI
    const roi = totalWagered > 0 ? (netProfit / totalWagered) * 100 : 0;

    // Calculate win rate from bet/win/loss transactions
    const settledBets = wins.length + losses.length;
    const winRate = settledBets > 0 ? (wins.length / settledBets) * 100 : 0;

    // Calculate average bet size
    const avgBetSize = bets.length > 0 ? totalWagered / bets.length : 0;

    // Find biggest win and loss
    const biggestWin = wins.length > 0 ? Math.max(...wins.map(t => t.amount)) : 0;
    const biggestLoss = losses.length > 0 ? Math.abs(Math.min(...losses.map(t => t.amount))) : 0;

    // Calculate current streak
    const { currentStreak, longestWinStreak, longestLossStreak } = calculateStreaks(
      transactions.filter(t => t.type === 'win' || t.type === 'loss')
    );

    // Get starting balance for period
    const firstTransactionBeforePeriod = await prisma.bankrollTransaction.findFirst({
      where: {
        userId: session.user.id,
        createdAt: { lt: startDate },
      },
      orderBy: { createdAt: 'desc' },
      select: { balance: true },
    });
    const startingBalance = firstTransactionBeforePeriod?.balance || 0;

    const snapshot = {
      period,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),

      // Current state
      currentBalance: Math.round(currentBalance * 100) / 100,
      startingBalance: Math.round(startingBalance * 100) / 100,
      balanceChange: Math.round((currentBalance - startingBalance) * 100) / 100,

      // Deposits/Withdrawals
      totalDeposits: Math.round(totalDeposits * 100) / 100,
      totalWithdrawals: Math.round(totalWithdrawals * 100) / 100,

      // Betting activity
      totalWagered: Math.round(totalWagered * 100) / 100,
      totalWon: Math.round(totalWon * 100) / 100,
      totalLost: Math.round(totalLost * 100) / 100,
      netProfit: Math.round(netProfit * 100) / 100,

      // Performance metrics
      roi: Math.round(roi * 10) / 10,
      winRate: Math.round(winRate * 10) / 10,
      avgBetSize: Math.round(avgBetSize * 100) / 100,

      // Extremes
      biggestWin: Math.round(biggestWin * 100) / 100,
      biggestLoss: Math.round(biggestLoss * 100) / 100,

      // Streaks
      currentStreak,
      longestWinStreak,
      longestLossStreak,

      // Counts
      totalTransactions: transactions.length,
      totalBets: bets.length,
      totalWins: wins.length,
      totalLosses: losses.length,
    };

    return NextResponse.json({
      success: true,
      snapshot,
    });
  } catch (error) {
    console.error('[Bankroll] Snapshot error:', error);
    return NextResponse.json({ error: 'Failed to fetch bankroll snapshot' }, { status: 500 });
  }
}

function getPeriodDates(period: string): { startDate: Date; endDate: Date } {
  const endDate = new Date();
  let startDate = new Date();

  switch (period) {
    case 'daily':
      startDate.setDate(endDate.getDate() - 1);
      break;
    case 'weekly':
      startDate.setDate(endDate.getDate() - 7);
      break;
    case 'monthly':
      startDate.setMonth(endDate.getMonth() - 1);
      break;
    case 'yearly':
      startDate.setFullYear(endDate.getFullYear() - 1);
      break;
    case 'all_time':
    default:
      startDate = new Date(0); // Unix epoch
      break;
  }

  return { startDate, endDate };
}

function calculateStreaks(transactions: any[]) {
  const sorted = transactions.sort((a, b) =>
    new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

  let currentStreak = 0;
  let longestWinStreak = 0;
  let longestLossStreak = 0;
  let tempStreak = 0;

  for (const transaction of sorted) {
    if (transaction.type === 'win') {
      tempStreak = tempStreak >= 0 ? tempStreak + 1 : 1;
      longestWinStreak = Math.max(longestWinStreak, tempStreak);
    } else if (transaction.type === 'loss') {
      tempStreak = tempStreak <= 0 ? tempStreak - 1 : -1;
      longestLossStreak = Math.max(longestLossStreak, Math.abs(tempStreak));
    }
  }

  currentStreak = tempStreak;

  return { currentStreak, longestWinStreak, longestLossStreak };
}
