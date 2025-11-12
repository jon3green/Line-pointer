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
    const type = searchParams.get('type') || undefined;
    const status = searchParams.get('status') || undefined;
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const where: any = { userId: session.user.id };
    if (type) where.channel = type;
    if (status) where.status = status;

    // Fetch from NotificationQueue (alerts history)
    const alerts = await prisma.notificationQueue.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });

    const total = await prisma.notificationQueue.count({ where });

    // Transform to user-friendly format
    const formattedAlerts = alerts.map(alert => ({
      id: alert.id,
      type: alert.type,
      channel: alert.channel,
      priority: alert.priority,
      title: alert.title,
      message: alert.message,
      data: alert.data ? JSON.parse(alert.data) : null,
      actionUrl: alert.actionUrl,
      status: alert.status,
      sentAt: alert.sentAt,
      createdAt: alert.createdAt,
      errorMessage: alert.errorMessage,
    }));

    return NextResponse.json({
      success: true,
      alerts: formattedAlerts,
      count: formattedAlerts.length,
      total,
      hasMore: offset + formattedAlerts.length < total,
    });
  } catch (error) {
    console.error('[Alerts] History error:', error);
    return NextResponse.json({ error: 'Failed to fetch alert history' }, { status: 500 });
  }
}
