import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// POST - Queue an alert to be sent
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      type,
      channel,
      priority,
      title,
      message,
      data,
      actionUrl,
      scheduledFor,
      expiresAt,
    } = body;

    // Validate required fields
    if (!type || !channel || !title || !message) {
      return NextResponse.json(
        { error: 'Missing required fields: type, channel, title, message' },
        { status: 400 }
      );
    }

    // Validate type
    const validTypes = ['push', 'email', 'sms', 'in_app'];
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: `Invalid type. Must be one of: ${validTypes.join(', ')}` },
        { status: 400 }
      );
    }

    // Validate priority
    const validPriorities = ['low', 'normal', 'high', 'urgent'];
    if (priority && !validPriorities.includes(priority)) {
      return NextResponse.json(
        { error: `Invalid priority. Must be one of: ${validPriorities.join(', ')}` },
        { status: 400 }
      );
    }

    // Create deduplication key
    const dedupeKey = `${session.user.id}-${channel}-${title}-${Date.now()}`;

    // Create notification
    const notification = await prisma.notificationQueue.create({
      data: {
        userId: session.user.id,
        type,
        channel,
        priority: priority || 'normal',
        title,
        message,
        data: data ? JSON.stringify(data) : null,
        actionUrl: actionUrl || null,
        dedupeKey,
        scheduledFor: scheduledFor ? new Date(scheduledFor) : null,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        status: 'pending',
      },
    });

    return NextResponse.json({
      success: true,
      notification: {
        id: notification.id,
        type: notification.type,
        channel: notification.channel,
        priority: notification.priority,
        status: notification.status,
        scheduledFor: notification.scheduledFor,
      },
      message: 'Alert queued successfully',
    });
  } catch (error) {
    console.error('[Alerts] Send error:', error);
    return NextResponse.json({ error: 'Failed to queue alert' }, { status: 500 });
  }
}
