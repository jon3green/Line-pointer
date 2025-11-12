import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// POST - Follow/Unfollow a user
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { userId, action } = body; // action: 'follow' or 'unfollow'

    if (!userId || !action) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const currentUserId = (session.user as any).id;

    if (currentUserId === userId) {
      return NextResponse.json(
        { error: 'Cannot follow yourself' },
        { status: 400 }
      );
    }

    if (action === 'follow') {
      // Check if already following
      const existingFollow = await prisma.follow.findUnique({
        where: {
          followerId_followingId: {
            followerId: currentUserId,
            followingId: userId,
          },
        },
      });

      if (existingFollow) {
        return NextResponse.json(
          { error: 'Already following this user' },
          { status: 400 }
        );
      }

      // Create follow relationship
      await prisma.follow.create({
        data: {
          followerId: currentUserId,
          followingId: userId,
        },
      });

      // Update denormalized counts
      await Promise.all([
        prisma.user.update({
          where: { id: currentUserId },
          data: { followingCount: { increment: 1 } },
        }),
        prisma.user.update({
          where: { id: userId },
          data: { followerCount: { increment: 1 } },
        }),
      ]);

      return NextResponse.json({
        success: true,
        message: 'User followed successfully',
      });
    } else if (action === 'unfollow') {
      // Delete follow relationship
      const deleted = await prisma.follow.deleteMany({
        where: {
          followerId: currentUserId,
          followingId: userId,
        },
      });

      if (deleted.count === 0) {
        return NextResponse.json(
          { error: 'Not following this user' },
          { status: 400 }
        );
      }

      // Update denormalized counts
      await Promise.all([
        prisma.user.update({
          where: { id: currentUserId },
          data: { followingCount: { decrement: 1 } },
        }),
        prisma.user.update({
          where: { id: userId },
          data: { followerCount: { decrement: 1 } },
        }),
      ]);

      return NextResponse.json({
        success: true,
        message: 'User unfollowed successfully',
      });
    } else {
      return NextResponse.json(
        { error: 'Invalid action. Must be "follow" or "unfollow"' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Follow/Unfollow error:', error);
    return NextResponse.json(
      { error: 'Failed to process follow action' },
      { status: 500 }
    );
  }
}

// GET - Get followers or following list
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const type = searchParams.get('type'); // 'followers' or 'following'
    const limit = parseInt(searchParams.get('limit') || '20');
    const cursor = searchParams.get('cursor');

    if (!userId || !type) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    if (type === 'followers') {
      const follows = await prisma.follow.findMany({
        where: { followingId: userId },
        ...(cursor && { cursor: { id: cursor }, skip: 1 }),
        take: limit,
        orderBy: { createdAt: 'desc' },
      });

      // Fetch user details separately
      const userIds = follows.map((f) => f.followerId);
      const followers = await prisma.user.findMany({
        where: { id: { in: userIds } },
        select: {
          id: true,
          username: true,
          name: true,
          image: true,
          followerCount: true,
          followingCount: true,
        },
      });

      // Create a map for quick lookup
      const userMap = new Map(followers.map((u) => [u.id, u]));

      const users = follows.map((f) => ({
        ...userMap.get(f.followerId),
        followedAt: f.createdAt,
      }));

      return NextResponse.json({
        success: true,
        users,
        nextCursor: follows.length === limit ? follows[follows.length - 1].id : null,
      });
    } else if (type === 'following') {
      const follows = await prisma.follow.findMany({
        where: { followerId: userId },
        ...(cursor && { cursor: { id: cursor }, skip: 1 }),
        take: limit,
        orderBy: { createdAt: 'desc' },
      });

      // Fetch user details separately
      const userIds = follows.map((f) => f.followingId);
      const following = await prisma.user.findMany({
        where: { id: { in: userIds } },
        select: {
          id: true,
          username: true,
          name: true,
          image: true,
          followerCount: true,
          followingCount: true,
        },
      });

      // Create a map for quick lookup
      const userMap = new Map(following.map((u) => [u.id, u]));

      const users = follows.map((f) => ({
        ...userMap.get(f.followingId),
        followedAt: f.createdAt,
      }));

      return NextResponse.json({
        success: true,
        users,
        nextCursor: follows.length === limit ? follows[follows.length - 1].id : null,
      });
    } else {
      return NextResponse.json(
        { error: 'Invalid type. Must be "followers" or "following"' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Fetch follow list error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch follow list' },
      { status: 500 }
    );
  }
}
