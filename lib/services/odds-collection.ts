/**
 * Odds Collection Service
 * Collects and stores historical odds for line movement analysis
 */

import { prisma } from '../prisma';
import { fetchRealTimeOdds, processOddsData, type OddsAPIGame } from '../api/odds-api';
import { fetchGames } from '../api/sports-data';
import { Sport } from '../types';
import { logTelemetry, logTelemetryError } from '../telemetry';

export interface CollectionResult {
  sport: Sport;
  gamesProcessed: number;
  oddsSnapshotsSaved: number;
  alertsCreated: number;
  errors: string[];
  duration: number;
}

/**
 * Collect odds for all active sports
 */
export async function collectAllOdds(): Promise<CollectionResult[]> {
  const sports: Sport[] = ['NFL', 'NCAAF'];
  const results: CollectionResult[] = [];

  for (const sport of sports) {
    try {
      const result = await collectOddsForSport(sport);
      results.push(result);
    } catch (error) {
      logTelemetryError('odds_collection_sport_failed', error, { sport });
      results.push({
        sport,
        gamesProcessed: 0,
        oddsSnapshotsSaved: 0,
        alertsCreated: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
        duration: 0,
      });
    }
  }

  logTelemetry('odds_collection_complete', {
    totalGames: results.reduce((sum, r) => sum + r.gamesProcessed, 0),
    totalSnapshots: results.reduce((sum, r) => sum + r.oddsSnapshotsSaved, 0),
    totalAlerts: results.reduce((sum, r) => sum + r.alertsCreated, 0),
  });

  return results;
}

/**
 * Collect odds for a specific sport
 */
export async function collectOddsForSport(sport: Sport): Promise<CollectionResult> {
  const startTime = Date.now();
  const result: CollectionResult = {
    sport,
    gamesProcessed: 0,
    oddsSnapshotsSaved: 0,
    alertsCreated: 0,
    errors: [],
    duration: 0,
  };

  try {
    // Fetch current games from ESPN
    const games = await fetchGames(sport);

    // Filter for upcoming games (within next 7 days)
    const now = new Date();
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const upcomingGames = games.filter(game => {
      const gameDate = new Date(game.date);
      return game.status === 'scheduled' && gameDate > now && gameDate < sevenDaysFromNow;
    });

    logTelemetry('odds_collection_games_found', {
      sport,
      totalGames: games.length,
      upcomingGames: upcomingGames.length,
    });

    if (upcomingGames.length === 0) {
      result.duration = Date.now() - startTime;
      return result;
    }

    // Fetch real-time odds
    const oddsData = await fetchRealTimeOdds(sport);

    if (oddsData.length === 0) {
      logTelemetry('odds_collection_no_odds', { sport });
      result.duration = Date.now() - startTime;
      return result;
    }

    // Process each game's odds
    for (const game of upcomingGames) {
      try {
        // Find matching odds from The Odds API
        const matchingOdds = findMatchingOdds(game.homeTeam.name, game.awayTeam.name, oddsData);

        if (matchingOdds) {
          const processed = processOddsData(matchingOdds);
          if (processed) {
            // Store odds snapshot
            const snapshot = await storeOddsSnapshot(game, processed);
            result.oddsSnapshotsSaved++;

            // Analyze line movement and create alerts if needed
            const alerts = await analyzeLineMovement(game.id, snapshot);
            result.alertsCreated += alerts.length;
          }
        }

        result.gamesProcessed++;
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        result.errors.push(`Game ${game.id}: ${errorMsg}`);
        logTelemetryError('odds_collection_game_failed', error, {
          gameId: game.id,
          sport,
        });
      }
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    result.errors.push(errorMsg);
    logTelemetryError('odds_collection_failed', error, { sport });
  }

  result.duration = Date.now() - startTime;
  return result;
}

/**
 * Find matching odds from The Odds API data
 */
function findMatchingOdds(
  homeTeam: string,
  awayTeam: string,
  oddsData: OddsAPIGame[]
): OddsAPIGame | null {
  const normalize = (name: string) => {
    return name
      .toLowerCase()
      .replace(/\s+/g, '')
      .replace(/[^a-z0-9]/g, '');
  };

  const normalizedHome = normalize(homeTeam);
  const normalizedAway = normalize(awayTeam);

  return oddsData.find(odds => {
    const oddsHome = normalize(odds.home_team);
    const oddsAway = normalize(odds.away_team);

    return (
      (oddsHome === normalizedHome && oddsAway === normalizedAway) ||
      (oddsHome.includes(normalizedHome) && oddsAway.includes(normalizedAway)) ||
      (normalizedHome.includes(oddsHome) && normalizedAway.includes(oddsAway))
    );
  }) || null;
}

/**
 * Store odds snapshot in database
 */
async function storeOddsSnapshot(game: any, odds: any) {
  const snapshot = await prisma.oddsHistory.create({
    data: {
      gameId: game.id,
      externalGameId: game.id,
      sport: game.league,
      homeTeam: game.homeTeam.name,
      awayTeam: game.awayTeam.name,
      gameTime: new Date(game.date),

      // Spread
      spread: odds.spread?.home || null,
      spreadHomeOdds: odds.spread?.homeOdds || null,
      spreadAwayOdds: odds.spread?.awayOdds || null,

      // Total
      total: odds.total?.line || null,
      overOdds: odds.total?.over || null,
      underOdds: odds.total?.under || null,

      // Moneyline
      homeML: odds.moneyline?.home || null,
      awayML: odds.moneyline?.away || null,

      // Source
      bookmaker: odds.bookmaker,
      source: 'TheOddsAPI',

      // Movement indicators (will be calculated in analyzeLineMovement)
      isSignificantMove: false,
      isSteamMove: false,
      isRLM: false,
      sharpMoney: false,
    },
  });

  logTelemetry('odds_snapshot_stored', {
    gameId: game.id,
    sport: game.league,
    bookmaker: odds.bookmaker,
  });

  return snapshot;
}

/**
 * Analyze line movement and create alerts
 */
async function analyzeLineMovement(gameId: string, currentSnapshot: any) {
  const alerts: any[] = [];

  try {
    // Get historical snapshots for this game (last 24 hours)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const history = await prisma.oddsHistory.findMany({
      where: {
        gameId,
        timestamp: {
          gte: oneDayAgo,
        },
      },
      orderBy: {
        timestamp: 'asc',
      },
    });

    if (history.length < 2) {
      // Not enough history to detect movement
      return alerts;
    }

    const openingSnapshot = history[0];
    const previousSnapshot = history[history.length - 2];

    // Calculate movements
    const spreadMovement = currentSnapshot.spread && openingSnapshot.spread
      ? currentSnapshot.spread - openingSnapshot.spread
      : null;

    const totalMovement = currentSnapshot.total && openingSnapshot.total
      ? currentSnapshot.total - openingSnapshot.total
      : null;

    const mlMovement = currentSnapshot.homeML && openingSnapshot.homeML
      ? currentSnapshot.homeML - openingSnapshot.homeML
      : null;

    // Update snapshot with movement data
    await prisma.oddsHistory.update({
      where: { id: currentSnapshot.id },
      data: {
        spreadMovement: spreadMovement || undefined,
        totalMovement: totalMovement || undefined,
        mlMovement: mlMovement || undefined,
        isSignificantMove: spreadMovement ? Math.abs(spreadMovement) > 2 : false,
        isSteamMove: detectSteamMove(history, currentSnapshot),
        sharpMoney: spreadMovement ? Math.abs(spreadMovement) > 1.5 : false,
      },
    });

    // Create alerts for significant movements
    if (spreadMovement && Math.abs(spreadMovement) > 2) {
      const alert = await createLineMovementAlert({
        gameId,
        externalGameId: currentSnapshot.externalGameId,
        sport: currentSnapshot.sport,
        homeTeam: currentSnapshot.homeTeam,
        awayTeam: currentSnapshot.awayTeam,
        gameTime: currentSnapshot.gameTime,
        type: 'significant_move',
        severity: Math.abs(spreadMovement) > 3 ? 'high' : 'medium',
        title: `${Math.abs(spreadMovement).toFixed(1)} Point Line Move`,
        message: `Spread moved from ${openingSnapshot.spread} to ${currentSnapshot.spread} (${spreadMovement > 0 ? '+' : ''}${spreadMovement.toFixed(1)})`,
        openingLine: openingSnapshot.spread,
        currentLine: currentSnapshot.spread,
        movement: spreadMovement,
        movementPercent: (spreadMovement / Math.abs(openingSnapshot.spread || 1)) * 100,
      });

      alerts.push(alert);
    }

    // Check for steam move (rapid movement in short time)
    if (detectSteamMove(history, currentSnapshot)) {
      const recentMovement = currentSnapshot.spread && previousSnapshot.spread
        ? currentSnapshot.spread - previousSnapshot.spread
        : null;

      if (recentMovement && Math.abs(recentMovement) > 1) {
        const alert = await createLineMovementAlert({
          gameId,
          externalGameId: currentSnapshot.externalGameId,
          sport: currentSnapshot.sport,
          homeTeam: currentSnapshot.homeTeam,
          awayTeam: currentSnapshot.awayTeam,
          gameTime: currentSnapshot.gameTime,
          type: 'steam_move',
          severity: 'high',
          title: 'Steam Move Detected',
          message: `Rapid ${Math.abs(recentMovement).toFixed(1)} point move in last snapshot - possible sharp action`,
          openingLine: openingSnapshot.spread,
          currentLine: currentSnapshot.spread,
          movement: recentMovement,
          movementPercent: (recentMovement / Math.abs(previousSnapshot.spread || 1)) * 100,
        });

        alerts.push(alert);
      }
    }
  } catch (error) {
    logTelemetryError('line_movement_analysis_failed', error, { gameId });
  }

  return alerts;
}

/**
 * Detect steam move (rapid line movement)
 */
function detectSteamMove(history: any[], currentSnapshot: any): boolean {
  if (history.length < 2) return false;

  const previousSnapshot = history[history.length - 2];
  const timeDiff = new Date(currentSnapshot.timestamp).getTime() - new Date(previousSnapshot.timestamp).getTime();
  const minutesDiff = timeDiff / (1000 * 60);

  if (minutesDiff > 15) return false; // Not recent enough

  const spreadChange = currentSnapshot.spread && previousSnapshot.spread
    ? Math.abs(currentSnapshot.spread - previousSnapshot.spread)
    : 0;

  return spreadChange >= 1; // 1+ point move in <15 minutes
}

/**
 * Create line movement alert
 */
async function createLineMovementAlert(data: any) {
  const alert = await prisma.lineMovementAlert.create({
    data: {
      ...data,
      indicators: JSON.stringify({
        timestamp: new Date().toISOString(),
        bookmaker: 'Consensus',
      }),
      expiresAt: data.gameTime,
    },
  });

  logTelemetry('line_movement_alert_created', {
    gameId: data.gameId,
    type: data.type,
    severity: data.severity,
    movement: data.movement,
  });

  return alert;
}

/**
 * Get recent line movement alerts
 */
export async function getRecentLineMovementAlerts(limit: number = 10) {
  const alerts = await prisma.lineMovementAlert.findMany({
    where: {
      createdAt: {
        gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
      },
      expiresAt: {
        gte: new Date(), // Not expired
      },
    },
    orderBy: [
      { severity: 'desc' },
      { createdAt: 'desc' },
    ],
    take: limit,
  });

  return alerts;
}

/**
 * Get odds history for a game
 */
export async function getGameOddsHistory(gameId: string) {
  const history = await prisma.oddsHistory.findMany({
    where: { gameId },
    orderBy: { timestamp: 'asc' },
  });

  return history;
}

/**
 * Clean up old odds data (keep last 30 days)
 */
export async function cleanupOldOddsData() {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const deleted = await prisma.oddsHistory.deleteMany({
    where: {
      timestamp: {
        lt: thirtyDaysAgo,
      },
    },
  });

  logTelemetry('odds_history_cleanup', {
    deletedCount: deleted.count,
  });

  return deleted.count;
}
