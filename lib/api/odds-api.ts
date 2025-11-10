/**
 * The Odds API Integration
 * Real-time odds, line movements, and sharp money detection
 */

import { Sport } from '../types';
import { logTelemetry, logTelemetryError } from '../telemetry';

const ODDS_API_BASE = 'https://api.the-odds-api.com/v4';
const API_KEY = process.env.NEXT_PUBLIC_ODDS_API_KEY;

// Map our sports to The Odds API sport keys
const SPORT_MAPPING: Record<Sport, string> = {
  NFL: 'americanfootball_nfl',
  NCAAF: 'americanfootball_ncaaf',
  TABLE_TENNIS: 'table_tennis', // Most likely not available
};

export interface OddsAPIGame {
  id: string;
  sport_key: string;
  sport_title: string;
  commence_time: string;
  home_team: string;
  away_team: string;
  bookmakers: Bookmaker[];
}

export interface Bookmaker {
  key: string;
  title: string;
  last_update: string;
  markets: Market[];
}

export interface Market {
  key: string; // 'h2h' | 'spreads' | 'totals'
  last_update: string;
  outcomes: Outcome[];
}

export interface Outcome {
  name: string;
  price: number; // American odds
  point?: number; // For spreads and totals
}

export interface ProcessedOdds {
  spread: {
    home: number;
    away: number;
    homeOdds: number;
    awayOdds: number;
  } | null;
  total: {
    line: number;
    over: number;
    under: number;
  } | null;
  moneyline: {
    home: number;
    away: number;
  } | null;
  bookmaker: string;
  lastUpdate: string;
}

export interface LineMovement {
  gameId: string;
  sport: Sport;
  homeTeam: string;
  awayTeam: string;
  openingLine: {
    spread: number;
    total: number;
    homeML: number;
  };
  currentLine: {
    spread: number;
    total: number;
    homeML: number;
  };
  movement: {
    spread: number;
    spreadPercent: number;
    total: number;
    totalPercent: number;
    moneyline: number;
  };
  indicators: {
    isSignificantMove: boolean; // >2 point spread move
    isSteamMove: boolean; // Rapid movement
    isReverseLineMovement: boolean; // Against public money
    sharpMoneyDetected: boolean;
  };
  timestamp: string;
}

/**
 * Fetch real-time odds from The Odds API
 */
export async function fetchRealTimeOdds(sport: Sport): Promise<OddsAPIGame[]> {
  if (!API_KEY) {
    logTelemetryError('odds_api_no_key', new Error('Missing API key'), { sport });
    return [];
  }

  const sportKey = SPORT_MAPPING[sport];
  if (!sportKey) {
    logTelemetry('odds_api_sport_not_supported', { sport });
    return [];
  }

  try {
    const url = `${ODDS_API_BASE}/sports/${sportKey}/odds/?apiKey=${API_KEY}&regions=us&markets=h2h,spreads,totals&oddsFormat=american&bookmakers=fanduel,draftkings,betmgm`;

    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Odds API error: ${response.status} ${response.statusText}`);
    }

    const data: OddsAPIGame[] = await response.json();

    logTelemetry('odds_api_fetch_success', {
      sport,
      gameCount: data.length,
      remainingRequests: response.headers.get('x-requests-remaining'),
      usedRequests: response.headers.get('x-requests-used'),
    });

    return data;
  } catch (error) {
    logTelemetryError('odds_api_fetch_failed', error, { sport });
    return [];
  }
}

/**
 * Process raw odds data into our format
 * Uses consensus from top sportsbooks (FanDuel, DraftKings, BetMGM)
 */
export function processOddsData(game: OddsAPIGame): ProcessedOdds | null {
  if (!game.bookmakers || game.bookmakers.length === 0) {
    return null;
  }

  // Prefer FanDuel, then DraftKings, then BetMGM
  const preferredBookmakers = ['fanduel', 'draftkings', 'betmgm'];
  const bookmaker = game.bookmakers.find(b =>
    preferredBookmakers.includes(b.key)
  ) || game.bookmakers[0];

  const processed: ProcessedOdds = {
    spread: null,
    total: null,
    moneyline: null,
    bookmaker: bookmaker.title,
    lastUpdate: bookmaker.last_update,
  };

  // Process each market type
  bookmaker.markets.forEach(market => {
    if (market.key === 'h2h') {
      // Moneyline
      const homeOutcome = market.outcomes.find(o => o.name === game.home_team);
      const awayOutcome = market.outcomes.find(o => o.name === game.away_team);

      if (homeOutcome && awayOutcome) {
        processed.moneyline = {
          home: homeOutcome.price,
          away: awayOutcome.price,
        };
      }
    } else if (market.key === 'spreads') {
      // Spread
      const homeOutcome = market.outcomes.find(o => o.name === game.home_team);
      const awayOutcome = market.outcomes.find(o => o.name === game.away_team);

      if (homeOutcome && awayOutcome && homeOutcome.point !== undefined && awayOutcome.point !== undefined) {
        processed.spread = {
          home: homeOutcome.point,
          away: awayOutcome.point,
          homeOdds: homeOutcome.price,
          awayOdds: awayOutcome.price,
        };
      }
    } else if (market.key === 'totals') {
      // Totals (Over/Under)
      const overOutcome = market.outcomes.find(o => o.name === 'Over');
      const underOutcome = market.outcomes.find(o => o.name === 'Under');

      if (overOutcome && underOutcome && overOutcome.point !== undefined) {
        processed.total = {
          line: overOutcome.point,
          over: overOutcome.price,
          under: underOutcome.price,
        };
      }
    }
  });

  return processed;
}

/**
 * Detect line movement by comparing historical odds
 * This would typically query a database of historical odds
 * For now, we'll structure it to work with future implementation
 */
export async function detectLineMovement(
  gameId: string,
  currentOdds: ProcessedOdds,
  historicalOdds?: ProcessedOdds[]
): Promise<LineMovement | null> {
  // In production, this would query database for opening lines and historical movements
  // For now, we'll return a placeholder structure

  if (!currentOdds.spread || !currentOdds.total || !currentOdds.moneyline) {
    return null;
  }

  // Placeholder opening lines (would come from database)
  const openingSpread = currentOdds.spread.home;
  const openingTotal = currentOdds.total.line;
  const openingHomeML = currentOdds.moneyline.home;

  const spreadMovement = currentOdds.spread.home - openingSpread;
  const totalMovement = currentOdds.total.line - openingTotal;
  const mlMovement = currentOdds.moneyline.home - openingHomeML;

  const movement: LineMovement = {
    gameId,
    sport: 'NFL', // Would be passed in
    homeTeam: '', // Would be passed in
    awayTeam: '', // Would be passed in
    openingLine: {
      spread: openingSpread,
      total: openingTotal,
      homeML: openingHomeML,
    },
    currentLine: {
      spread: currentOdds.spread.home,
      total: currentOdds.total.line,
      homeML: currentOdds.moneyline.home,
    },
    movement: {
      spread: spreadMovement,
      spreadPercent: (spreadMovement / Math.abs(openingSpread || 1)) * 100,
      total: totalMovement,
      totalPercent: (totalMovement / openingTotal) * 100,
      moneyline: mlMovement,
    },
    indicators: {
      isSignificantMove: Math.abs(spreadMovement) > 2,
      isSteamMove: false, // Would require time-series data
      isReverseLineMovement: false, // Would require betting percentage data
      sharpMoneyDetected: Math.abs(spreadMovement) > 2,
    },
    timestamp: new Date().toISOString(),
  };

  logTelemetry('line_movement_detected', {
    gameId,
    spreadMovement: spreadMovement.toFixed(1),
    totalMovement: totalMovement.toFixed(1),
    isSignificant: movement.indicators.isSignificantMove,
  });

  return movement;
}

/**
 * Get remaining API requests for the month
 */
export async function getAPIUsage(): Promise<{
  remaining: number;
  used: number;
  limit: number;
} | null> {
  if (!API_KEY) {
    return null;
  }

  try {
    // Make a minimal request to check usage
    const url = `${ODDS_API_BASE}/sports/?apiKey=${API_KEY}`;
    const response = await fetch(url);

    const remaining = parseInt(response.headers.get('x-requests-remaining') || '0');
    const used = parseInt(response.headers.get('x-requests-used') || '0');

    return {
      remaining,
      used,
      limit: 500, // Free tier limit
    };
  } catch (error) {
    logTelemetryError('odds_api_usage_check_failed', error, {});
    return null;
  }
}

/**
 * Calculate consensus odds from multiple bookmakers
 */
export function calculateConsensusOdds(games: OddsAPIGame[]): Map<string, ProcessedOdds> {
  const consensus = new Map<string, ProcessedOdds>();

  games.forEach(game => {
    if (game.bookmakers.length === 0) return;

    // Average odds across all bookmakers
    const allSpreads: number[] = [];
    const allTotals: number[] = [];
    const allHomeML: number[] = [];
    const allAwayML: number[] = [];

    game.bookmakers.forEach(bookmaker => {
      bookmaker.markets.forEach(market => {
        if (market.key === 'spreads') {
          const homeOutcome = market.outcomes.find(o => o.name === game.home_team);
          if (homeOutcome && homeOutcome.point !== undefined) {
            allSpreads.push(homeOutcome.point);
          }
        } else if (market.key === 'totals') {
          const overOutcome = market.outcomes.find(o => o.name === 'Over');
          if (overOutcome && overOutcome.point !== undefined) {
            allTotals.push(overOutcome.point);
          }
        } else if (market.key === 'h2h') {
          const homeOutcome = market.outcomes.find(o => o.name === game.home_team);
          const awayOutcome = market.outcomes.find(o => o.name === game.away_team);
          if (homeOutcome) allHomeML.push(homeOutcome.price);
          if (awayOutcome) allAwayML.push(awayOutcome.price);
        }
      });
    });

    const avgSpread = allSpreads.length > 0 ?
      allSpreads.reduce((a, b) => a + b, 0) / allSpreads.length : null;
    const avgTotal = allTotals.length > 0 ?
      allTotals.reduce((a, b) => a + b, 0) / allTotals.length : null;
    const avgHomeML = allHomeML.length > 0 ?
      Math.round(allHomeML.reduce((a, b) => a + b, 0) / allHomeML.length) : null;
    const avgAwayML = allAwayML.length > 0 ?
      Math.round(allAwayML.reduce((a, b) => a + b, 0) / allAwayML.length) : null;

    const consensusOdds: ProcessedOdds = {
      spread: avgSpread !== null ? {
        home: avgSpread,
        away: -avgSpread,
        homeOdds: -110,
        awayOdds: -110,
      } : null,
      total: avgTotal !== null ? {
        line: avgTotal,
        over: -110,
        under: -110,
      } : null,
      moneyline: (avgHomeML !== null && avgAwayML !== null) ? {
        home: avgHomeML,
        away: avgAwayML,
      } : null,
      bookmaker: 'Consensus',
      lastUpdate: new Date().toISOString(),
    };

    consensus.set(game.id, consensusOdds);
  });

  return consensus;
}

/**
 * Store historical odds for line movement tracking
 * This would write to database in production
 */
export async function storeHistoricalOdds(
  gameId: string,
  odds: ProcessedOdds
): Promise<void> {
  // In production: Insert into database
  // prisma.oddsHistory.create({
  //   data: {
  //     gameId,
  //     spread: odds.spread?.home,
  //     total: odds.total?.line,
  //     homeML: odds.moneyline?.home,
  //     awayML: odds.moneyline?.away,
  //     bookmaker: odds.bookmaker,
  //     timestamp: new Date(),
  //   }
  // });

  logTelemetry('historical_odds_stored', {
    gameId,
    bookmaker: odds.bookmaker,
  });
}
