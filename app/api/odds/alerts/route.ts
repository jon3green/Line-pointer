import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const unreadOnly = searchParams.get('unreadOnly') === 'true';
    const gameId = searchParams.get('gameId');

    const where: any = {};

    if (unreadOnly) {
      where.read = false;
    }

    if (gameId) {
      where.gameId = gameId;
    }

    // Only show alerts for upcoming games (not expired)
    where.expiresAt = {
      gte: new Date(),
    };

    const alerts = await prisma.lineMovementAlert.findMany({
      where,
      orderBy: [
        { severity: 'desc' }, // critical, high, medium, low
        { createdAt: 'desc' },
      ],
      take: limit,
    });

    return NextResponse.json({
      success: true,
      alerts,
      count: alerts.length
    });
  } catch (error) {
    console.error('Get line movement alerts error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch line movement alerts' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const { alertId } = await request.json();

    if (!alertId) {
      return NextResponse.json(
        { error: 'Alert ID is required' },
        { status: 400 }
      );
    }

    const alert = await prisma.lineMovementAlert.update({
      where: { id: alertId },
      data: {
        read: true,
        readAt: new Date(),
      },
    });

    return NextResponse.json({ success: true, alert });
  } catch (error) {
    console.error('Mark alert as read error:', error);
    return NextResponse.json(
      { error: 'Failed to mark alert as read' },
      { status: 500 }
    );
  }
}
