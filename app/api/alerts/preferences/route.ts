import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// GET user alert preferences
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let settings = await prisma.userSettings.findUnique({
      where: { userId: session.user.id },
    });

    // Create default settings if they don't exist
    if (!settings) {
      settings = await prisma.userSettings.create({
        data: {
          userId: session.user.id,
        },
      });
    }

    return NextResponse.json({
      success: true,
      preferences: {
        // Notification channels
        emailNotifications: settings.emailNotifications,
        pushNotifications: settings.pushNotifications,
        smsNotifications: settings.smsNotifications,

        // Alert types
        highConfidenceAlerts: settings.highConfidenceAlerts,
        lineMovementAlerts: settings.lineMovementAlerts,
        injuryAlerts: settings.injuryAlerts,
        weatherAlerts: settings.weatherAlerts,
        gameStartAlerts: settings.gameStartAlerts,
        resultAlerts: settings.resultAlerts,

        // Thresholds
        minConfidenceThreshold: settings.minConfidenceThreshold,
        minLineMovement: settings.minLineMovement,

        // Other settings
        favoriteTeams: settings.favoriteTeams ? JSON.parse(settings.favoriteTeams) : [],
      },
    });
  } catch (error) {
    console.error('[Alerts] Preferences GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch preferences' }, { status: 500 });
  }
}

// PUT update user alert preferences
export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    const updateData: any = {};

    // Notification channels
    if (body.emailNotifications !== undefined) {
      updateData.emailNotifications = body.emailNotifications;
    }
    if (body.pushNotifications !== undefined) {
      updateData.pushNotifications = body.pushNotifications;
    }
    if (body.smsNotifications !== undefined) {
      updateData.smsNotifications = body.smsNotifications;
    }

    // Alert types
    if (body.highConfidenceAlerts !== undefined) {
      updateData.highConfidenceAlerts = body.highConfidenceAlerts;
    }
    if (body.lineMovementAlerts !== undefined) {
      updateData.lineMovementAlerts = body.lineMovementAlerts;
    }
    if (body.injuryAlerts !== undefined) {
      updateData.injuryAlerts = body.injuryAlerts;
    }
    if (body.weatherAlerts !== undefined) {
      updateData.weatherAlerts = body.weatherAlerts;
    }
    if (body.gameStartAlerts !== undefined) {
      updateData.gameStartAlerts = body.gameStartAlerts;
    }
    if (body.resultAlerts !== undefined) {
      updateData.resultAlerts = body.resultAlerts;
    }

    // Thresholds
    if (body.minConfidenceThreshold !== undefined) {
      updateData.minConfidenceThreshold = Math.max(50, Math.min(100, body.minConfidenceThreshold));
    }
    if (body.minLineMovement !== undefined) {
      updateData.minLineMovement = Math.max(0.5, body.minLineMovement);
    }

    // Other settings
    if (body.favoriteTeams !== undefined) {
      updateData.favoriteTeams = JSON.stringify(body.favoriteTeams);
    }

    // Upsert settings
    const settings = await prisma.userSettings.upsert({
      where: { userId: session.user.id },
      update: updateData,
      create: {
        userId: session.user.id,
        ...updateData,
      },
    });

    return NextResponse.json({
      success: true,
      preferences: settings,
      message: 'Preferences updated successfully',
    });
  } catch (error) {
    console.error('[Alerts] Preferences PUT error:', error);
    return NextResponse.json({ error: 'Failed to update preferences' }, { status: 500 });
  }
}
