import { NextResponse } from 'next/server';
import { getRecentLineMovementAlerts } from '@/lib/services/odds-collection';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/**
 * GET /api/odds/alerts
 * Get recent line movement alerts
 *
 * Query params:
 * - limit: number (default: 10)
 * - unread: boolean (optional)
 * - sport: string (optional)
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const unread = searchParams.get('unread') === 'true';
    const sport = searchParams.get('sport');

    let where: any = {
      createdAt: {
        gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
      },
      expiresAt: {
        gte: new Date(), // Not expired
      },
    };

    if (unread) {
      where.read = false;
    }

    if (sport) {
      where.sport = sport;
    }

    const alerts = await prisma.lineMovementAlert.findMany({
      where,
      orderBy: [
        { severity: 'desc' },
        { createdAt: 'desc' },
      ],
      take: limit,
    });

    return NextResponse.json({
      success: true,
      alerts,
      count: alerts.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error fetching alerts:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch alerts',
      },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/odds/alerts
 * Mark alert as read
 *
 * Body:
 * - alertId: string
 */
export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { alertId } = body;

    if (!alertId) {
      return NextResponse.json(
        { success: false, error: 'alertId is required' },
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

    return NextResponse.json({
      success: true,
      alert,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error updating alert:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update alert',
      },
      { status: 500 }
    );
  }
}
