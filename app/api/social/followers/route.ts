import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const sessionUserId = (session.user as { id?: string })?.id;
    if (!sessionUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || sessionUserId;

    // Get followers
    const followers = await prisma.follow.findMany({
      where: {
        followingId: userId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({ success: true, followers, count: followers.length });
  } catch (error) {
    console.error('Get followers error:', error);
    return NextResponse.json({ error: 'Failed to fetch followers' }, { status: 500 });
  }
}

