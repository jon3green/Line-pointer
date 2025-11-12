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
    const period = searchParams.get('period') || 'daily'; // 'daily', 'weekly', 'monthly'
    const limit = parseInt(searchParams.get('limit') || '30');

    // Get all transactions
    const transactions = await prisma.bankrollTransaction.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'asc' },
    });

    if (transactions.length === 0) {
      return NextResponse.json({
        success: true,
        history: [],
        message: 'No transaction history available',
      });
    }

    // Group transactions by period
    const grouped = groupByPeriod(transactions, period);

    // Calculate snapshot for each period
    const history = grouped.map(group => {
      const periodTransactions = group.transactions;

      const deposits = periodTransactions.filter(t => t.type === 'deposit');
      const withdrawals = periodTransactions.filter(t => t.type === 'withdrawal');
      const bets = periodTransactions.filter(t => t.type === 'bet');
      const wins = periodTransactions.filter(t => t.type === 'win');
      const losses = periodTransactions.filter(t => t.type === 'loss');

      const totalDeposits = deposits.reduce((sum, t) => sum + t.amount, 0);
      const totalWithdrawals = Math.abs(withdrawals.reduce((sum, t) => sum + t.amount, 0));
      const totalWagered = Math.abs(bets.reduce((sum, t) => sum + t.amount, 0));
      const totalWon = wins.reduce((sum, t) => sum + t.amount, 0);
      const totalLost = Math.abs(losses.reduce((sum, t) => sum + t.amount, 0));
      const netProfit = totalWon - totalLost;

      const settledBets = wins.length + losses.length;
      const winRate = settledBets > 0 ? (wins.length / settledBets) * 100 : 0;
      const roi = totalWagered > 0 ? (netProfit / totalWagered) * 100 : 0;
      const avgBetSize = bets.length > 0 ? totalWagered / bets.length : 0;

      // Get balance at end of period (last transaction balance)
      const endBalance = periodTransactions.length > 0
        ? periodTransactions[periodTransactions.length - 1].balance
        : 0;

      return {
        date: group.date,
        balance: Math.round(endBalance * 100) / 100,
        totalDeposits: Math.round(totalDeposits * 100) / 100,
        totalWithdrawals: Math.round(totalWithdrawals * 100) / 100,
        totalWagered: Math.round(totalWagered * 100) / 100,
        totalWon: Math.round(totalWon * 100) / 100,
        totalLost: Math.round(totalLost * 100) / 100,
        netProfit: Math.round(netProfit * 100) / 100,
        roi: Math.round(roi * 10) / 10,
        winRate: Math.round(winRate * 10) / 10,
        avgBetSize: Math.round(avgBetSize * 100) / 100,
        totalBets: bets.length,
        wonBets: wins.length,
        lostBets: losses.length,
      };
    }).slice(-limit); // Get most recent periods

    return NextResponse.json({
      success: true,
      history,
      period,
      count: history.length,
    });
  } catch (error) {
    console.error('[Bankroll] History error:', error);
    return NextResponse.json({ error: 'Failed to fetch bankroll history' }, { status: 500 });
  }
}

function groupByPeriod(transactions: any[], period: string) {
  const groups = new Map<string, any[]>();

  transactions.forEach(transaction => {
    const date = new Date(transaction.createdAt);
    let key: string;

    if (period === 'daily') {
      key = date.toISOString().split('T')[0]; // YYYY-MM-DD
    } else if (period === 'weekly') {
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay()); // Start of week (Sunday)
      key = weekStart.toISOString().split('T')[0];
    } else if (period === 'monthly') {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      key = `${year}-${month}-01`;
    } else {
      key = date.toISOString().split('T')[0];
    }

    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key)!.push(transaction);
  });

  return Array.from(groups.entries())
    .map(([date, transactions]) => ({ date, transactions }))
    .sort((a, b) => a.date.localeCompare(b.date));
}
