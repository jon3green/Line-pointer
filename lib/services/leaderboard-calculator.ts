import { prisma } from '@/lib/prisma';

/**
 * Leaderboard Calculator Service
 * Calculates rankings and updates user stats
 */

interface UserPerformance {
  userId: string;
  username: string;
  totalBets: number;
  wonBets: number;
  lostBets: number;
  pushBets: number;
  winRate: number;
  totalWagered: number;
  totalProfit: number;
  roi: number;
  currentStreak: number;
}

/**
 * Calculate user performance for a specific period/sport/bet type
 */
async function calculateUserPerformance(
  userId: string,
  filters: {
    startDate?: Date;
    endDate?: Date;
    sport?: string;
    betType?: string;
  }
): Promise<UserPerformance | null> {
  const where: any = { userId };
  if (filters.sport) where.sport = filters.sport;
  if (filters.betType) where.betType = filters.betType;
  if (filters.startDate || filters.endDate) {
    where.createdAt = {};
    if (filters.startDate) where.createdAt.gte = filters.startDate;
    if (filters.endDate) where.createdAt.lte = filters.endDate;
  }

  // Get all bets for this user in the period
  const bets = await prisma.bet.findMany({
    where,
    orderBy: { createdAt: 'asc' },
  });

  if (bets.length === 0) {
    return null;
  }

  // Calculate metrics
  const totalBets = bets.length;
  const wonBets = bets.filter(b => b.status === 'won').length;
  const lostBets = bets.filter(b => b.status === 'lost').length;
  const pushBets = bets.filter(b => b.status === 'push').length;

  const settledBets = wonBets + lostBets;
  const winRate = settledBets > 0 ? (wonBets / settledBets) * 100 : 0;

  const totalWagered = bets.reduce((sum, bet) => sum + bet.stake, 0);
  const totalWon = bets
    .filter(b => b.status === 'won')
    .reduce((sum, bet) => sum + bet.potentialWin, 0);
  const totalLost = bets
    .filter(b => b.status === 'lost')
    .reduce((sum, bet) => sum + bet.stake, 0);
  const totalProfit = totalWon - totalLost;
  const roi = totalWagered > 0 ? (totalProfit / totalWagered) * 100 : 0;

  // Calculate current streak
  const settledBetsOrdered = bets
    .filter(b => b.status === 'won' || b.status === 'lost')
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  let currentStreak = 0;
  if (settledBetsOrdered.length > 0) {
    const lastStatus = settledBetsOrdered[0].status;
    for (const bet of settledBetsOrdered) {
      if (bet.status === lastStatus) {
        currentStreak += lastStatus === 'won' ? 1 : -1;
      } else {
        break;
      }
    }
  }

  // Get username
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { name: true },
  });

  return {
    userId,
    username: user?.name || 'Anonymous',
    totalBets,
    wonBets,
    lostBets,
    pushBets,
    winRate: Math.round(winRate * 10) / 10,
    totalWagered: Math.round(totalWagered * 100) / 100,
    totalProfit: Math.round(totalProfit * 100) / 100,
    roi: Math.round(roi * 10) / 10,
    currentStreak,
  };
}

/**
 * Get date ranges for periods
 */
function getPeriodDateRange(period: string): { startDate: Date; endDate: Date } {
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
    case 'season':
      // Football season: September to February
      const currentMonth = endDate.getMonth();
      if (currentMonth >= 8) {
        // Sep-Dec: season started this year
        startDate = new Date(endDate.getFullYear(), 8, 1); // Sept 1
      } else {
        // Jan-Aug: season started last year
        startDate = new Date(endDate.getFullYear() - 1, 8, 1);
      }
      break;
    case 'all_time':
    default:
      startDate = new Date(0); // Unix epoch
      break;
  }

  return { startDate, endDate };
}

/**
 * Calculate leaderboard for specific configuration
 */
async function calculateLeaderboard(
  period: string,
  sport: string | null,
  betType: string | null
): Promise<void> {
  const { startDate, endDate } = getPeriodDateRange(period);

  // Get all users who have placed bets in this period
  const where: any = {
    createdAt: {
      gte: startDate,
      lte: endDate,
    },
  };
  if (sport) where.sport = sport;
  if (betType) where.betType = betType;

  const userIds = await prisma.bet.findMany({
    where,
    select: { userId: true },
    distinct: ['userId'],
  });

  const uniqueUserIds = [...new Set(userIds.map(u => u.userId))];

  // Calculate performance for each user
  const rankings: any[] = [];
  for (const userId of uniqueUserIds) {
    const performance = await calculateUserPerformance(userId, {
      startDate,
      endDate,
      sport: sport || undefined,
      betType: betType || undefined,
    });

    if (performance && performance.totalBets >= 5) {
      // Minimum 5 bets to appear on leaderboard
      rankings.push({
        userId: performance.userId,
        username: performance.username,
        totalBets: performance.totalBets,
        wins: performance.wonBets,
        losses: performance.lostBets,
        winRate: performance.winRate,
        profit: performance.totalProfit,
        roi: performance.roi,
        streak: performance.currentStreak,
      });
    }
  }

  // Sort by ROI (default)
  rankings.sort((a, b) => b.roi - a.roi);

  // Assign ranks
  rankings.forEach((r, idx) => {
    r.rank = idx + 1;
  });

  // Upsert leaderboard
  await prisma.leaderboard.upsert({
    where: {
      period_sport_betType_startDate_endDate: {
        period,
        sport,
        betType,
        startDate,
        endDate,
      },
    },
    update: {
      rankings: JSON.stringify(rankings),
      totalUsers: rankings.length,
      calculatedAt: new Date(),
    },
    create: {
      period,
      sport,
      betType,
      startDate,
      endDate,
      rankings: JSON.stringify(rankings),
      totalUsers: rankings.length,
    },
  });
}

/**
 * Update user stats for all users
 */
async function updateUserStats(): Promise<number> {
  // Get all users who have placed bets
  const userIds = await prisma.bet.findMany({
    select: { userId: true },
    distinct: ['userId'],
  });

  const uniqueUserIds = [...new Set(userIds.map(u => u.userId))];

  let updated = 0;
  for (const userId of uniqueUserIds) {
    // Calculate all-time performance
    const performance = await calculateUserPerformance(userId, {});

    if (!performance) continue;

    // Calculate stats by sport
    const sports = ['NFL', 'NCAAF', 'NBA', 'MLB'];
    const sportStats: any = {};
    for (const sport of sports) {
      const sportPerf = await calculateUserPerformance(userId, { sport });
      if (sportPerf) {
        sportStats[sport.toLowerCase()] = {
          bets: sportPerf.totalBets,
          wins: sportPerf.wonBets,
          roi: sportPerf.roi,
          profit: sportPerf.totalProfit,
        };
      }
    }

    // Calculate stats by bet type
    const betTypes = ['spread', 'moneyline', 'total', 'prop'];
    const betTypeStats: any = {};
    for (const betType of betTypes) {
      const betTypePerf = await calculateUserPerformance(userId, { betType });
      if (betTypePerf) {
        betTypeStats[betType] = {
          bets: betTypePerf.totalBets,
          wins: betTypePerf.wonBets,
          roi: betTypePerf.roi,
          profit: betTypePerf.totalProfit,
        };
      }
    }

    // Find biggest win and loss
    const wonBets = await prisma.bet.findMany({
      where: { userId, status: 'won' },
      orderBy: { potentialWin: 'desc' },
      take: 1,
    });
    const lostBets = await prisma.bet.findMany({
      where: { userId, status: 'lost' },
      orderBy: { stake: 'desc' },
      take: 1,
    });

    const biggestWin = wonBets.length > 0 ? wonBets[0].potentialWin - wonBets[0].stake : null;
    const biggestLoss = lostBets.length > 0 ? lostBets[0].stake : null;

    // Calculate best and worst streaks
    const allBets = await prisma.bet.findMany({
      where: {
        userId,
        status: { in: ['won', 'lost'] },
      },
      orderBy: { createdAt: 'asc' },
    });

    let bestStreak = 0;
    let worstStreak = 0;
    let tempStreak = 0;

    for (const bet of allBets) {
      if (bet.status === 'won') {
        tempStreak = tempStreak >= 0 ? tempStreak + 1 : 1;
        bestStreak = Math.max(bestStreak, tempStreak);
      } else {
        tempStreak = tempStreak <= 0 ? tempStreak - 1 : -1;
        worstStreak = Math.min(worstStreak, tempStreak);
      }
    }

    // Upsert user stats
    await prisma.userStats.upsert({
      where: { userId },
      update: {
        totalBets: performance.totalBets,
        wonBets: performance.wonBets,
        lostBets: performance.lostBets,
        pushedBets: performance.pushBets,
        winRate: performance.winRate,
        totalWagered: performance.totalWagered,
        totalProfit: performance.totalProfit,
        roi: performance.roi,
        currentStreak: performance.currentStreak,
        bestStreak,
        worstStreak: Math.abs(worstStreak),
        biggestWin,
        biggestLoss,
        nflStats: sportStats.nfl ? JSON.stringify(sportStats.nfl) : null,
        ncaafStats: sportStats.ncaaf ? JSON.stringify(sportStats.ncaaf) : null,
        nbaStats: sportStats.nba ? JSON.stringify(sportStats.nba) : null,
        mlbStats: sportStats.mlb ? JSON.stringify(sportStats.mlb) : null,
        spreadStats: betTypeStats.spread ? JSON.stringify(betTypeStats.spread) : null,
        moneylineStats: betTypeStats.moneyline ? JSON.stringify(betTypeStats.moneyline) : null,
        totalStats: betTypeStats.total ? JSON.stringify(betTypeStats.total) : null,
        propStats: betTypeStats.prop ? JSON.stringify(betTypeStats.prop) : null,
        lastBetAt: allBets.length > 0 ? allBets[allBets.length - 1].createdAt : null,
      },
      create: {
        userId,
        totalBets: performance.totalBets,
        wonBets: performance.wonBets,
        lostBets: performance.lostBets,
        pushedBets: performance.pushBets,
        winRate: performance.winRate,
        totalWagered: performance.totalWagered,
        totalProfit: performance.totalProfit,
        roi: performance.roi,
        currentStreak: performance.currentStreak,
        bestStreak,
        worstStreak: Math.abs(worstStreak),
        biggestWin,
        biggestLoss,
      },
    });

    updated++;
  }

  return updated;
}

/**
 * Calculate all leaderboards
 */
export async function calculateLeaderboards(): Promise<{
  leaderboardsCreated: number;
  userStatsUpdated: number;
}> {
  let leaderboardsCreated = 0;

  // Update user stats first
  const userStatsUpdated = await updateUserStats();

  // Calculate leaderboards for different configurations
  const periods = ['daily', 'weekly', 'monthly', 'season', 'all_time'];
  const sports = [null, 'NFL', 'NCAAF', 'NBA', 'MLB'];
  const betTypes = [null, 'spread', 'moneyline', 'total', 'prop'];

  // Overall leaderboards (all sports, all bet types)
  for (const period of periods) {
    await calculateLeaderboard(period, null, null);
    leaderboardsCreated++;
  }

  // By sport (all bet types)
  for (const sport of sports) {
    if (sport) {
      await calculateLeaderboard('all_time', sport, null);
      await calculateLeaderboard('monthly', sport, null);
      leaderboardsCreated += 2;
    }
  }

  // By bet type (all sports)
  for (const betType of betTypes) {
    if (betType) {
      await calculateLeaderboard('all_time', null, betType);
      leaderboardsCreated++;
    }
  }

  return { leaderboardsCreated, userStatsUpdated };
}
