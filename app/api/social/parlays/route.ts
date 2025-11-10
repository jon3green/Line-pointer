import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const sport = searchParams.get('sport');
    const userId = searchParams.get('userId');
    const limit = parseInt(searchParams.get('limit') || '20');

    const where: any = {
      isPublic: true,
    };

    if (sport) {
      where.sport = sport.toUpperCase();
    }

    if (userId) {
      where.userId = userId;
    }

    const parlays = await prisma.sharedParlay.findMany({
      where,
      orderBy: [
        { likes: 'desc' },
        { createdAt: 'desc' },
      ],
      take: limit,
    });

    return NextResponse.json({ success: true, parlays, count: parlays.length });
  } catch (error) {
    console.error('Get shared parlays error:', error);
    return NextResponse.json({ error: 'Failed to fetch parlays' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as { id?: string })?.id;
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { legs = [], stake, title, description, visibility = 'public', sport } = body;

    const derivedSport = (sport ?? legs[0]?.game?.league ?? 'NFL').toString().toUpperCase();

    const parlay = await prisma.sharedParlay.create({
      data: {
        userId,
        title: title ?? 'Shared Parlay',
        description: description ?? null,
        parlayData: JSON.stringify({ legs, stake }),
        sport: derivedSport,
        isPublic: visibility !== 'private',
      },
    });

    return NextResponse.json({ success: true, parlay }, { status: 201 });
  } catch (error) {
    console.error('Create shared parlay error:', error);
    return NextResponse.json({ error: 'Failed to share parlay' }, { status: 500 });
  }
}

