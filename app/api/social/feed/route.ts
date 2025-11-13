import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/**
 * GET - Activity feed showing recent bets from followed users
 */
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const feedType = searchParams.get('type') || 'following'; // 'following', 'public', 'personal'

    let activities: any[] = [];

    if (feedType === 'following') {
      // Get users this person is following
      const follows = await prisma.follow.findMany({
        where: { followerId: session.user.id },
        select: { followingId: true },
      });

      const followingIds = follows.map(f => f.followingId);

      if (followingIds.length === 0) {
        return NextResponse.json({
          success: true,
          feed: [],
          count: 0,
          message: 'Not following anyone yet',
        });
      }

      // Get recent bets from followed users
      const bets = await prisma.bet.findMany({
        where: {
          userId: { in: followingIds },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
        include: {
          game: {
            select: {
              homeTeam: true,
              awayTeam: true,
              gameTime: true,
              sport: true,
            },
          },
        },
      });

      // Get user details
      const userIds = [...new Set(bets.map(b => b.userId))];
      const users = await prisma.user.findMany({
        where: { id: { in: userIds } },
        select: {
          id: true,
          name: true,
          image: true,
        },
      });

      const userMap = new Map(users.map(u => [u.id, u]));

      activities = bets.map(bet => {
        const user = userMap.get(bet.userId);
        return {
          id: bet.id,
          type: 'bet_placed',
          user: {
            id: user?.id,
            name: user?.name,
            image: user?.image,
          },
          bet: {
            selection: bet.selection,
            betType: bet.betType,
            odds: bet.odds,
            stake: bet.stake,
            status: bet.status,
            line: bet.line,
          },
          game: bet.game ? {
            homeTeam: bet.game.homeTeam,
            awayTeam: bet.game.awayTeam,
            gameTime: bet.game.gameTime,
            sport: bet.game.sport,
          } : null,
          createdAt: bet.createdAt,
        };
      });
    } else if (feedType === 'public') {
      // Get public shared parlays
      const sharedParlays = await prisma.sharedParlay.findMany({
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      });

      // Get user details
      const userIds = [...new Set(sharedParlays.map(p => p.userId))];
      const users = await prisma.user.findMany({
        where: { id: { in: userIds } },
        select: {
          id: true,
          name: true,
          image: true,
        },
      });

      const userMap = new Map(users.map(u => [u.id, u]));

      activities = sharedParlays.map(parlay => {
        const user = userMap.get(parlay.userId);
        const parlayData = JSON.parse(parlay.parlayData);
        return {
          id: parlay.id,
          type: 'parlay_shared',
          user: {
            id: user?.id,
            name: user?.name,
            image: user?.image,
          },
          parlay: {
            title: parlay.title,
            description: parlay.description,
            sport: parlay.sport,
            legs: parlayData.legs || [],
            totalOdds: parlayData.totalOdds,
            status: parlayData.status,
          },
          likes: parlay.likes,
          views: parlay.views,
          createdAt: parlay.createdAt,
        };
      });
    } else if (feedType === 'personal') {
      // Get user's own recent bets
      const bets = await prisma.bet.findMany({
        where: {
          userId: session.user.id,
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
        include: {
          game: {
            select: {
              homeTeam: true,
              awayTeam: true,
              gameTime: true,
              sport: true,
            },
          },
        },
      });

      activities = bets.map(bet => {
        const gameData = bet.game ? {
          homeTeam: bet.game.homeTeam,
          awayTeam: bet.game.awayTeam,
          gameTime: bet.game.gameTime,
          sport: bet.game.sport,
        } : null;

        return {
          id: bet.id,
          type: 'bet_placed',
          bet: {
            selection: bet.selection,
            betType: bet.betType,
            odds: bet.odds,
            stake: bet.stake,
            status: bet.status,
            line: bet.line,
          },
          game: gameData,
          createdAt: bet.createdAt,
        };
      });
    }

    return NextResponse.json({
      success: true,
      feed: activities,
      count: activities.length,
      hasMore: activities.length === limit,
    });
  } catch (error) {
    console.error('[Social] Feed error:', error);
    return NextResponse.json({ error: 'Failed to fetch feed' }, { status: 500 });
  }
}
