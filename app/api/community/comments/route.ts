import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET - Fetch comments for a shared parlay
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const parlayId = searchParams.get('parlayId');
    const limit = parseInt(searchParams.get('limit') || '20');
    const cursor = searchParams.get('cursor');

    if (!parlayId) {
      return NextResponse.json(
        { error: 'Missing parlayId parameter' },
        { status: 400 }
      );
    }

    const comments = await prisma.comment.findMany({
      where: { sharedParlayId: parlayId },
      ...(cursor && { cursor: { id: cursor }, skip: 1 }),
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            name: true,
            image: true,
            followerCount: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      comments,
      nextCursor: comments.length === limit ? comments[comments.length - 1].id : null,
    });
  } catch (error) {
    console.error('Fetch comments error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch comments' },
      { status: 500 }
    );
  }
}

// POST - Create a new comment
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { parlayId, content } = body;

    if (!parlayId || !content) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (content.trim().length === 0 || content.length > 500) {
      return NextResponse.json(
        { error: 'Comment must be between 1 and 500 characters' },
        { status: 400 }
      );
    }

    // Verify parlay exists
    const parlay = await prisma.sharedParlay.findUnique({
      where: { id: parlayId },
    });

    if (!parlay) {
      return NextResponse.json(
        { error: 'Parlay not found' },
        { status: 404 }
      );
    }

    const comment = await prisma.comment.create({
      data: {
        userId: (session.user as any).id,
        sharedParlayId: parlayId,
        content: content.trim(),
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            name: true,
            image: true,
            followerCount: true,
          },
        },
      },
    });

    return NextResponse.json({ success: true, comment }, { status: 201 });
  } catch (error) {
    console.error('Create comment error:', error);
    return NextResponse.json(
      { error: 'Failed to create comment' },
      { status: 500 }
    );
  }
}
