import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET - Fetch shared parlays (public feed)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const sport = searchParams.get('sport');
    const limit = parseInt(searchParams.get('limit') || '20');
    const cursor = searchParams.get('cursor');

    const where: any = { isPublic: true };
    if (sport) where.sport = sport;

    const parlays = await prisma.sharedParlay.findMany({
      where,
      ...(cursor && { cursor: { id: cursor }, skip: 1 }),
      take: limit,
      orderBy: [
        { likes: 'desc' },
        { createdAt: 'desc' }
      ],
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
        comments: {
          take: 3,
          orderBy: { createdAt: 'desc' },
          include: {
            user: {
              select: {
                id: true,
                username: true,
                name: true,
                image: true,
              },
            },
          },
        },
        _count: {
          select: { comments: true },
        },
      },
    });

    // Increment view counts
    await Promise.all(
      parlays.map((parlay) =>
        prisma.sharedParlay.update({
          where: { id: parlay.id },
          data: { views: { increment: 1 } },
        })
      )
    );

    return NextResponse.json({
      success: true,
      parlays,
      nextCursor: parlays.length === limit ? parlays[parlays.length - 1].id : null,
    });
  } catch (error) {
    console.error('Fetch shared parlays error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch parlays' },
      { status: 500 }
    );
  }
}

// POST - Share a new parlay
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { title, description, parlayData, sport } = body;

    if (!title || !parlayData || !sport) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const sharedParlay = await prisma.sharedParlay.create({
      data: {
        userId: (session.user as any).id,
        title,
        description,
        parlayData: JSON.stringify(parlayData),
        sport,
        isPublic: true,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            name: true,
            image: true,
          },
        },
      },
    });

    return NextResponse.json({ success: true, parlay: sharedParlay }, { status: 201 });
  } catch (error) {
    console.error('Share parlay error:', error);
    return NextResponse.json(
      { error: 'Failed to share parlay' },
      { status: 500 }
    );
  }
}
