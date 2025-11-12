import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const sortBy = searchParams.get('sortBy') || 'winRate'; // winRate, roi, profit, totalBets
    const sport = searchParams.get('sport'); // optional filter by sport
    const limit = parseInt(searchParams.get('limit') || '50');
    const timeframe = searchParams.get('timeframe') || 'all'; // all, week, month

    // Calculate timeframe start date
    let startDate: Date | undefined;
    if (timeframe === 'week') {
      startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    } else if (timeframe === 'month') {
      startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    }

    // Fetch all users with their bets
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        name: true,
        image: true,
        followerCount: true,
        bets: {
          where: {
            status: { in: ['won', 'lost', 'pushed'] },
            ...(sport && { sport }),
            ...(startDate && { createdAt: { gte: startDate } }),
          },
          select: {
            status: true,
            stake: true,
            potentialWin: true,
            sport: true,
          },
        },
      },
    });

    // Calculate stats for each user
    const leaderboard = users
      .map((user) => {
        const bets = user.bets;
        const totalBets = bets.length;

        if (totalBets === 0) {
          return null; // Skip users with no bets
        }

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

        return {
          userId: user.id,
          username: user.username,
          name: user.name,
          image: user.image,
          followerCount: user.followerCount,
          stats: {
            totalBets,
            wonBets,
            lostBets,
            pushedBets,
            winRate: Number(winRate.toFixed(2)),
            totalStaked: Number(totalStaked.toFixed(2)),
            profit: Number(profit.toFixed(2)),
            roi: Number(roi.toFixed(2)),
          },
        };
      })
      .filter((entry) => entry !== null); // Remove null entries

    // Sort by selected metric
    leaderboard.sort((a, b) => {
      if (sortBy === 'winRate') {
        // Minimum 10 bets to qualify for win rate leaderboard
        if (a!.stats.totalBets < 10) return 1;
        if (b!.stats.totalBets < 10) return -1;
        return b!.stats.winRate - a!.stats.winRate;
      } else if (sortBy === 'roi') {
        // Minimum 10 bets to qualify
        if (a!.stats.totalBets < 10) return 1;
        if (b!.stats.totalBets < 10) return -1;
        return b!.stats.roi - a!.stats.roi;
      } else if (sortBy === 'profit') {
        return b!.stats.profit - a!.stats.profit;
      } else if (sortBy === 'totalBets') {
        return b!.stats.totalBets - a!.stats.totalBets;
      }
      return 0;
    });

    // Add rank to each entry
    const rankedLeaderboard = leaderboard.slice(0, limit).map((entry, index) => ({
      ...entry,
      rank: index + 1,
    }));

    return NextResponse.json({
      success: true,
      leaderboard: rankedLeaderboard,
      sortBy,
      sport: sport || 'all',
      timeframe,
      count: rankedLeaderboard.length,
    });
  } catch (error) {
    console.error('Fetch leaderboard error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch leaderboard' },
      { status: 500 }
    );
  }
}
