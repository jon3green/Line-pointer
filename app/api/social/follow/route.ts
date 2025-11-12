import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// GET - Get followers/following for a user
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || session.user.id;
    const type = searchParams.get('type') || 'following'; // 'following' or 'followers'

    if (type === 'following') {
      // Get users this person is following
      const follows = await prisma.follow.findMany({
        where: { followerId: userId },
        select: {
          followingId: true,
          createdAt: true,
        },
      });

      // Get user details
      const userIds = follows.map(f => f.followingId);
      const users = await prisma.user.findMany({
        where: { id: { in: userIds } },
        select: {
          id: true,
          name: true,
          image: true,
        },
      });

      // Get user stats
      const stats = await prisma.userStats.findMany({
        where: { userId: { in: userIds } },
        select: {
          userId: true,
          winRate: true,
          roi: true,
          totalBets: true,
        },
      });

      const statsMap = new Map(stats.map(s => [s.userId, s]));

      const following = users.map(user => ({
        id: user.id,
        name: user.name,
        image: user.image,
        stats: statsMap.get(user.id) || null,
        followedAt: follows.find(f => f.followingId === user.id)?.createdAt,
      }));

      return NextResponse.json({
        success: true,
        following,
        count: following.length,
      });
    } else {
      // Get followers of this person
      const follows = await prisma.follow.findMany({
        where: { followingId: userId },
        select: {
          followerId: true,
          createdAt: true,
        },
      });

      // Get user details
      const userIds = follows.map(f => f.followerId);
      const users = await prisma.user.findMany({
        where: { id: { in: userIds } },
        select: {
          id: true,
          name: true,
          image: true,
        },
      });

      const followers = users.map(user => ({
        id: user.id,
        name: user.name,
        image: user.image,
        followedAt: follows.find(f => f.followerId === user.id)?.createdAt,
      }));

      return NextResponse.json({
        success: true,
        followers,
        count: followers.length,
      });
    }
  } catch (error) {
    console.error('[Social] Follow GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch follow data' }, { status: 500 });
  }
}

// POST - Follow a user
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { userId } = body;

    // Validate
    if (!userId) {
      return NextResponse.json({ error: 'userId required' }, { status: 400 });
    }

    // Can't follow yourself
    if (userId === session.user.id) {
      return NextResponse.json({ error: 'Cannot follow yourself' }, { status: 400 });
    }

    // Check if already following
    const existing = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: session.user.id,
          followingId: userId,
        },
      },
    });

    if (existing) {
      return NextResponse.json({ error: 'Already following this user' }, { status: 400 });
    }

    // Create follow
    await prisma.follow.create({
      data: {
        followerId: session.user.id,
        followingId: userId,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Successfully followed user',
    });
  } catch (error) {
    console.error('[Social] Follow POST error:', error);
    return NextResponse.json({ error: 'Failed to follow user' }, { status: 500 });
  }
}

// DELETE - Unfollow a user
export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'userId required' }, { status: 400 });
    }

    // Delete follow
    await prisma.follow.delete({
      where: {
        followerId_followingId: {
          followerId: session.user.id,
          followingId: userId,
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Successfully unfollowed user',
    });
  } catch (error) {
    console.error('[Social] Follow DELETE error:', error);
    return NextResponse.json({ error: 'Failed to unfollow user' }, { status: 500 });
  }
}
