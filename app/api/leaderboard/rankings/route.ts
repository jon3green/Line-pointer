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
    const period = searchParams.get('period') || 'all_time'; // 'daily', 'weekly', 'monthly', 'season', 'all_time'
    const sport = searchParams.get('sport') || null;
    const betType = searchParams.get('betType') || null;
    const limit = parseInt(searchParams.get('limit') || '100');
    const sortBy = searchParams.get('sortBy') || 'roi'; // 'roi', 'profit', 'winRate', 'totalBets'

    // Get or calculate leaderboard
    let leaderboard = await prisma.leaderboard.findFirst({
      where: {
        period,
        sport,
        betType,
      },
      orderBy: { calculatedAt: 'desc' },
    });

    // If no leaderboard exists or it's old, return empty with message
    if (!leaderboard) {
      return NextResponse.json({
        success: true,
        rankings: [],
        period,
        sport,
        betType,
        message: 'Leaderboard not yet calculated. Run /api/leaderboard/calculate',
      });
    }

    // Parse rankings
    const rankings = JSON.parse(leaderboard.rankings);

    // Sort by requested field
    let sortedRankings = [...rankings];
    switch (sortBy) {
      case 'profit':
        sortedRankings.sort((a, b) => b.profit - a.profit);
        break;
      case 'winRate':
        sortedRankings.sort((a, b) => b.winRate - a.winRate);
        break;
      case 'totalBets':
        sortedRankings.sort((a, b) => b.totalBets - a.totalBets);
        break;
      case 'roi':
      default:
        sortedRankings.sort((a, b) => b.roi - a.roi);
        break;
    }

    // Re-assign ranks based on sort
    sortedRankings = sortedRankings.map((r, idx) => ({
      ...r,
      rank: idx + 1,
    }));

    // Apply limit
    const limitedRankings = sortedRankings.slice(0, limit);

    // Find current user's rank
    const userRank = sortedRankings.findIndex(r => r.userId === session.user.id);
    const userRanking = userRank >= 0 ? sortedRankings[userRank] : null;

    return NextResponse.json({
      success: true,
      rankings: limitedRankings,
      userRanking,
      totalUsers: leaderboard.totalUsers,
      period,
      sport,
      betType,
      sortBy,
      calculatedAt: leaderboard.calculatedAt,
    });
  } catch (error) {
    console.error('[Leaderboard] Rankings error:', error);
    return NextResponse.json({ error: 'Failed to fetch rankings' }, { status: 500 });
  }
}
