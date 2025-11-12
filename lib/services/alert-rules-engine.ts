import { prisma } from '@/lib/prisma';

/**
 * Alert Rules Engine
 * Determines when to send alerts based on various conditions
 */

export interface AlertTrigger {
  userId: string;
  type: 'push' | 'email' | 'sms' | 'in_app';
  channel: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  title: string;
  message: string;
  data?: any;
  actionUrl?: string;
}

/**
 * Check for high confidence predictions that should trigger alerts
 */
export async function checkHighConfidencePredictions(): Promise<AlertTrigger[]> {
  const alerts: AlertTrigger[] = [];

  // Get all users with high confidence alerts enabled
  const users = await prisma.userSettings.findMany({
    where: {
      highConfidenceAlerts: true,
    },
    select: {
      userId: true,
      minConfidenceThreshold: true,
      pushNotifications: true,
      emailNotifications: true,
    },
  });

  // Get recent predictions that haven't been alerted yet
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const predictions = await prisma.prediction.findMany({
    where: {
      gameTime: {
        gte: now,
        lte: tomorrow,
      },
      alertSent: false,
    },
    include: {
      game: {
        select: {
          homeTeam: true,
          awayTeam: true,
          gameTime: true,
        },
      },
    },
  });

  // Match predictions with users based on confidence threshold
  for (const user of users) {
    const qualifyingPredictions = predictions.filter(
      pred => pred.confidence >= user.minConfidenceThreshold
    );

    for (const prediction of qualifyingPredictions) {
      // Determine notification type based on user preferences
      const notificationType = user.pushNotifications ? 'push' : user.emailNotifications ? 'email' : 'in_app';

      alerts.push({
        userId: user.userId,
        type: notificationType,
        channel: 'high_confidence_pick',
        priority: prediction.confidence >= 85 ? 'high' : 'normal',
        title: `${prediction.confidence}% Confidence Pick`,
        message: `${prediction.game.awayTeam} @ ${prediction.game.homeTeam} - ${prediction.prediction}`,
        data: {
          predictionId: prediction.id,
          gameId: prediction.gameId,
          confidence: prediction.confidence,
          prediction: prediction.prediction,
        },
        actionUrl: `/games/${prediction.gameId}`,
      });

      // Mark as alerted
      await prisma.prediction.update({
        where: { id: prediction.id },
        data: { alertSent: true },
      });
    }
  }

  return alerts;
}

/**
 * Check for significant line movements
 */
export async function checkLineMovements(): Promise<AlertTrigger[]> {
  const alerts: AlertTrigger[] = [];

  // Get users with line movement alerts enabled
  const users = await prisma.userSettings.findMany({
    where: {
      lineMovementAlerts: true,
    },
    select: {
      userId: true,
      minLineMovement: true,
      pushNotifications: true,
      emailNotifications: true,
    },
  });

  // Get recent line movement alerts that haven't been sent
  const recentMovements = await prisma.lineMovementAlert.findMany({
    where: {
      alertSent: false,
      detectedAt: {
        gte: new Date(Date.now() - 5 * 60 * 1000), // Last 5 minutes
      },
    },
    include: {
      game: {
        select: {
          homeTeam: true,
          awayTeam: true,
          gameTime: true,
        },
      },
    },
  });

  // Create alerts for qualifying movements
  for (const user of users) {
    const qualifyingMovements = recentMovements.filter(
      movement => Math.abs(movement.lineMovement) >= user.minLineMovement
    );

    for (const movement of qualifyingMovements) {
      const notificationType = user.pushNotifications ? 'push' : user.emailNotifications ? 'email' : 'in_app';

      const isRLM = movement.isReverseLineMovement ? ' (RLM)' : '';
      const isSteam = movement.isSteamMove ? ' [STEAM]' : '';

      alerts.push({
        userId: user.userId,
        type: notificationType,
        channel: 'line_movement',
        priority: movement.isSteamMove ? 'urgent' : 'high',
        title: `Line Move${isSteam}${isRLM}`,
        message: `${movement.game.awayTeam} @ ${movement.game.homeTeam}: ${movement.betType} moved ${movement.lineMovement > 0 ? '+' : ''}${movement.lineMovement}`,
        data: {
          gameId: movement.gameId,
          betType: movement.betType,
          oldLine: movement.oldLine,
          newLine: movement.newLine,
          lineMovement: movement.lineMovement,
          isSteamMove: movement.isSteamMove,
          isReverseLineMovement: movement.isReverseLineMovement,
        },
        actionUrl: `/games/${movement.gameId}`,
      });

      // Mark as alerted
      await prisma.lineMovementAlert.update({
        where: { id: movement.id },
        data: { alertSent: true },
      });
    }
  }

  return alerts;
}

/**
 * Check for key injury updates
 */
export async function checkInjuryAlerts(): Promise<AlertTrigger[]> {
  const alerts: AlertTrigger[] = [];

  // Get users with injury alerts enabled
  const users = await prisma.userSettings.findMany({
    where: {
      injuryAlerts: true,
    },
    select: {
      userId: true,
      favoriteTeams: true,
      pushNotifications: true,
      emailNotifications: true,
    },
  });

  // Get recent injury reports (high impact only)
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);

  const injuries = await prisma.injuryReport.findMany({
    where: {
      reportedAt: { gte: yesterday },
      impactScore: { gte: 50 }, // Only high impact injuries
      alertSent: false,
    },
  });

  for (const user of users) {
    const favoriteTeams = user.favoriteTeams ? JSON.parse(user.favoriteTeams) : [];

    // Filter injuries to favorite teams if specified
    const relevantInjuries = favoriteTeams.length > 0
      ? injuries.filter(inj => favoriteTeams.includes(inj.team))
      : injuries;

    for (const injury of relevantInjuries) {
      const notificationType = user.pushNotifications ? 'push' : user.emailNotifications ? 'email' : 'in_app';

      alerts.push({
        userId: user.userId,
        type: notificationType,
        channel: 'injury_alert',
        priority: injury.impactScore >= 70 ? 'high' : 'normal',
        title: `Injury Update: ${injury.team}`,
        message: `${injury.playerName} (${injury.position}) - ${injury.status}`,
        data: {
          playerId: injury.playerId,
          team: injury.team,
          playerName: injury.playerName,
          position: injury.position,
          status: injury.status,
          impactScore: injury.impactScore,
        },
      });
    }
  }

  // Mark all as alerted
  await prisma.injuryReport.updateMany({
    where: {
      id: { in: injuries.map(i => i.id) },
    },
    data: { alertSent: true },
  });

  return alerts;
}

/**
 * Check for game start reminders (1 hour before)
 */
export async function checkGameStartAlerts(): Promise<AlertTrigger[]> {
  const alerts: AlertTrigger[] = [];

  // Get users with game start alerts enabled
  const users = await prisma.userSettings.findMany({
    where: {
      gameStartAlerts: true,
    },
    select: {
      userId: true,
      favoriteTeams: true,
      pushNotifications: true,
      emailNotifications: true,
    },
  });

  // Get games starting in ~1 hour
  const now = new Date();
  const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);
  const oneHourFiveMinFromNow = new Date(now.getTime() + 65 * 60 * 1000);

  const upcomingGames = await prisma.game.findMany({
    where: {
      gameTime: {
        gte: oneHourFromNow,
        lte: oneHourFiveMinFromNow,
      },
      status: 'scheduled',
    },
  });

  for (const user of users) {
    const favoriteTeams = user.favoriteTeams ? JSON.parse(user.favoriteTeams) : [];

    for (const game of upcomingGames) {
      // Only alert if it's a favorite team or if no favorites specified
      if (favoriteTeams.length === 0 ||
          favoriteTeams.includes(game.homeTeam) ||
          favoriteTeams.includes(game.awayTeam)) {

        const notificationType = user.pushNotifications ? 'push' : user.emailNotifications ? 'email' : 'in_app';

        alerts.push({
          userId: user.userId,
          type: notificationType,
          channel: 'game_start',
          priority: 'normal',
          title: 'Game Starting Soon',
          message: `${game.awayTeam} @ ${game.homeTeam} starts in 1 hour`,
          data: {
            gameId: game.id,
            homeTeam: game.homeTeam,
            awayTeam: game.awayTeam,
            gameTime: game.gameTime,
          },
          actionUrl: `/games/${game.id}`,
        });
      }
    }
  }

  return alerts;
}

/**
 * Queue alerts to notification system
 */
export async function queueAlerts(alerts: AlertTrigger[]): Promise<number> {
  let queued = 0;

  for (const alert of alerts) {
    try {
      // Create deduplication key
      const dedupeKey = `${alert.userId}-${alert.channel}-${alert.title}-${Date.now()}`;

      // Check if already queued recently (within last 5 minutes)
      const existing = await prisma.notificationQueue.findFirst({
        where: {
          userId: alert.userId,
          channel: alert.channel,
          title: alert.title,
          createdAt: {
            gte: new Date(Date.now() - 5 * 60 * 1000),
          },
        },
      });

      if (existing) {
        continue; // Skip duplicate
      }

      // Queue notification
      await prisma.notificationQueue.create({
        data: {
          userId: alert.userId,
          type: alert.type,
          channel: alert.channel,
          priority: alert.priority,
          title: alert.title,
          message: alert.message,
          data: alert.data ? JSON.stringify(alert.data) : null,
          actionUrl: alert.actionUrl || null,
          dedupeKey,
          status: 'pending',
        },
      });

      queued++;
    } catch (error) {
      console.error('[AlertRulesEngine] Failed to queue alert:', error);
    }
  }

  return queued;
}

/**
 * Run all alert checks and queue notifications
 */
export async function runAlertChecks(): Promise<{ checked: number; queued: number }> {
  const allAlerts: AlertTrigger[] = [];

  // Run all checks
  const highConfidence = await checkHighConfidencePredictions();
  const lineMovements = await checkLineMovements();
  const injuries = await checkInjuryAlerts();
  const gameStarts = await checkGameStartAlerts();

  allAlerts.push(...highConfidence, ...lineMovements, ...injuries, ...gameStarts);

  // Queue all alerts
  const queued = await queueAlerts(allAlerts);

  return {
    checked: allAlerts.length,
    queued,
  };
}
