import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes

interface ESPNGame {
  id: string;
  name: string;
  shortName: string;
  date: string;
  competitions: Array<{
    id: string;
    date: string;
    attendance: number;
    type: { id: string };
    timeValid: boolean;
    neutralSite: boolean;
    conferenceCompetition: boolean;
    recent: boolean;
    venue: {
      id: string;
      fullName: string;
      address: { city: string; state: string };
      indoor: boolean;
    };
    competitors: Array<{
      id: string;
      uid: string;
      type: string;
      order: number;
      homeAway: string;
      team: {
        id: string;
        uid: string;
        location: string;
        name: string;
        abbreviation: string;
        displayName: string;
        shortDisplayName: string;
        color: string;
        alternateColor: string;
        isActive: boolean;
        logo: string;
      };
      score: string;
      linescores: Array<{ value: number }>;
      statistics: Array<any>;
      records: Array<{
        name: string;
        abbreviation: string;
        type: string;
        summary: string;
      }>;
    }>;
    status: {
      clock: number;
      displayClock: string;
      period: number;
      type: {
        id: string;
        name: string;
        state: string;
        completed: boolean;
        description: string;
        detail: string;
        shortDetail: string;
      };
    };
  }>;
  status: {
    clock: number;
    displayClock: string;
    period: number;
    type: {
      id: string;
      name: string;
      state: string;
      completed: boolean;
      description: string;
      detail: string;
      shortDetail: string;
    };
  };
}

interface ESPNScoreboard {
  leagues: Array<{
    id: string;
    uid: string;
    name: string;
    abbreviation: string;
    slug: string;
    season: {
      year: number;
      startDate: string;
      endDate: string;
      type: { id: string; type: number; name: string; abbreviation: string };
    };
    calendar: Array<any>;
  }>;
  season: {
    type: number;
    year: number;
  };
  week: { number: number };
  events: ESPNGame[];
}

/**
 * Fetch game results from ESPN API
 */
async function fetchESPNScoreboard(sport: 'nfl' | 'college-football', week?: number): Promise<ESPNGame[]> {
  try {
    const currentYear = new Date().getFullYear();
    let url = `https://site.api.espn.com/apis/site/v2/sports/football/${sport}/scoreboard`;

    if (week) {
      url += `?week=${week}&seasontype=2&year=${currentYear}`;
    }

    console.log(`[ESPN] Fetching ${sport} scoreboard:`, url);

    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`ESPN API error: ${response.status} ${response.statusText}`);
    }

    const data: ESPNScoreboard = await response.json();
    return data.events || [];
  } catch (error) {
    console.error(`[ESPN] Error fetching ${sport} scoreboard:`, error);
    return [];
  }
}

/**
 * Update game results in database
 */
async function updateGameResults(game: ESPNGame, sport: string) {
  try {
    const competition = game.competitions[0];
    if (!competition) return null;

    const homeTeam = competition.competitors.find(c => c.homeAway === 'home');
    const awayTeam = competition.competitors.find(c => c.homeAway === 'away');

    if (!homeTeam || !awayTeam) {
      console.log(`[Update] Missing team data for game ${game.id}`);
      return null;
    }

    const homeScore = parseInt(homeTeam.score) || null;
    const awayScore = parseInt(awayTeam.score) || null;
    const status = competition.status.type.completed ? 'final' :
                   competition.status.type.state === 'in' ? 'live' : 'scheduled';

    // Try to find game by ESPN ID
    const existingGame = await prisma.game.findFirst({
      where: {
        OR: [
          { externalId: game.id },
          {
            AND: [
              { homeTeam: homeTeam.team.displayName },
              { awayTeam: awayTeam.team.displayName },
              { gameTime: new Date(game.date) },
            ]
          }
        ]
      }
    });

    if (existingGame) {
      // Update existing game
      const updated = await prisma.game.update({
        where: { id: existingGame.id },
        data: {
          homeScore,
          awayScore,
          status,
          externalId: game.id,
        },
      });

      console.log(`[Update] Updated game: ${awayTeam.team.displayName} @ ${homeTeam.team.displayName} - ${awayScore}-${homeScore} (${status})`);

      // Update related predictions if game is final
      if (status === 'final' && homeScore !== null && awayScore !== null) {
        await updatePredictionResults(existingGame.id, homeScore, awayScore);
      }

      return updated;
    } else {
      console.log(`[Update] Game not found in database: ${game.id}`);
      return null;
    }
  } catch (error) {
    console.error('[Update] Error updating game:', error);
    return null;
  }
}

/**
 * Update prediction results after game completes
 */
async function updatePredictionResults(gameId: string, homeScore: number, awayScore: number) {
  try {
    const predictions = await prisma.prediction.findMany({
      where: {
        gameId,
        wasCorrect: null, // Only update predictions that haven't been scored yet
      },
    });

    for (const prediction of predictions) {
      const actualSpread = homeScore - awayScore;
      const predictedWinner = prediction.predictedWinner;
      const actualWinner = homeScore > awayScore ? 'home' : awayScore > homeScore ? 'away' : 'push';

      // Check if prediction was correct
      const wasCorrect = predictedWinner === actualWinner;

      // Check if beat the closing line
      const beatTheCloseSpread = prediction.closingSpread !== null && prediction.predictedSpread !== null
        ? Math.abs(prediction.predictedSpread - actualSpread) < Math.abs(prediction.closingSpread - actualSpread)
        : null;

      await prisma.prediction.update({
        where: { id: prediction.id },
        data: {
          actualWinner,
          homeScore,
          awayScore,
          actualSpread,
          wasCorrect,
          beatTheCloseSpread,
          resultsFetchedAt: new Date(),
        },
      });
    }

    console.log(`[Predictions] Updated ${predictions.length} predictions for game ${gameId}`);
  } catch (error) {
    console.error('[Predictions] Error updating prediction results:', error);
  }
}

/**
 * GET /api/cron/update-game-results
 * Cron endpoint for updating game results daily
 */
export async function GET(request: Request) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('[Cron] Starting game results update:', new Date().toISOString());

    const results = {
      nfl: { processed: 0, updated: 0, errors: 0 },
      cfb: { processed: 0, updated: 0, errors: 0 },
    };

    // Update NFL games (current week)
    const nflGames = await fetchESPNScoreboard('nfl');
    for (const game of nflGames) {
      results.nfl.processed++;
      const updated = await updateGameResults(game, 'NFL');
      if (updated) results.nfl.updated++;
      else results.nfl.errors++;
    }

    // Update College Football games (current week)
    const cfbGames = await fetchESPNScoreboard('college-football');
    for (const game of cfbGames) {
      results.cfb.processed++;
      const updated = await updateGameResults(game, 'NCAAF');
      if (updated) results.cfb.updated++;
      else results.cfb.errors++;
    }

    console.log('[Cron] Game results update completed:', results);

    return NextResponse.json({
      success: true,
      message: 'Game results updated',
      results,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[Cron] Error updating game results:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update game results',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  return GET(request);
}
