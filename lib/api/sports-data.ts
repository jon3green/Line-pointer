import { Game, Team, Sport, GameWeather, FeaturedParlay } from '../types';
import { calculateImpliedProbability } from '../utils';
import { cachedFetch, CACHE_TTL, generateCacheKey } from '../cache/redis';
import { checkRateLimit } from '../rate-limit';
import { logTelemetry, logTelemetryError } from '../telemetry';
import { fetchRealTimeOdds, processOddsData, type ProcessedOdds } from './odds-api';

const ESPN_API_ROOT = 'https://site.api.espn.com/apis/site/v2/sports';

const ESPN_LEAGUE_PATHS: Record<Sport, string> = {
  NFL: 'football/nfl',
  NCAAF: 'football/college-football',
  TABLE_TENNIS: 'tennis/table-tennis',
};

const DEFAULT_LEAGUE_ORDER: Sport[] = ['NFL', 'NCAAF'];

function toAmericanNumber(value: any): number | undefined {
  if (value === null || value === undefined) return undefined;
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : undefined;
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed.toUpperCase() === 'EVEN') return 100;
    const numeric = Number(trimmed.replace(/[^\d.-]/g, ''));
    return Number.isNaN(numeric) ? undefined : numeric;
  }
  return undefined;
}

/**
 * Fetch games for the requested league(s).
 * Integrates ESPN scoreboard data with real-time odds from The Odds API.
 */
export async function fetchGames(league?: Sport): Promise<Game[]> {
  const leaguesToFetch = league ? [league] : DEFAULT_LEAGUE_ORDER;

  const results = await Promise.all(
    leaguesToFetch.map(async (lg) => {
      try {
        const games = await fetchLeagueGames(lg);
        if (games.length === 0) {
          logTelemetry('espn_scoreboard_mock_fallback', { league: lg });
          return generateMockGames(lg);
        }

        // Enhance with real-time odds from The Odds API
        const enhancedGames = await enhanceGamesWithRealTimeOdds(games, lg);
        return enhancedGames;
      } catch (error) {
        logTelemetryError('espn_scoreboard_failed', error, { league: lg });
        return generateMockGames(lg);
      }
    })
  );

  const aggregated = results
    .flat()
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  logTelemetry('fetch_games_complete', {
    leaguesRequested: leaguesToFetch,
    gameCount: aggregated.length,
  });

  return aggregated;
}

/**
 * Placeholder for future deep-dive stats retrieval.
 */
export async function fetchTeamStats(teamId: string) {
  return {
    teamId,
    offense: {
      pointsPerGame: 27.5,
      yardsPerGame: 380.2,
      passingYards: 255.3,
      rushingYards: 124.9,
    },
    defense: {
      pointsAllowed: 21.3,
      yardsAllowed: 345.7,
      sacks: 2.8,
      turnovers: 1.2,
    },
    recent: {
      lastFive: '4-1',
      lastTen: '7-3',
    },
  };
}

/**
 * Fetch odds for a specific game (currently derived from scoreboard data).
 */
export async function fetchOdds(gameId: string) {
  const games = await fetchGames();
  const game = games.find((g) => g.id === gameId);
  return game?.odds ?? null;
}

/**
 * Enhance ESPN games with real-time odds from The Odds API
 * Prefers The Odds API data (more accurate, real-time) but falls back to ESPN if unavailable
 */
async function enhanceGamesWithRealTimeOdds(games: Game[], league: Sport): Promise<Game[]> {
  try {
    // Fetch real-time odds for this league
    const realTimeOddsData = await fetchRealTimeOdds(league);

    if (realTimeOddsData.length === 0) {
      logTelemetry('real_time_odds_unavailable', { league, usingESPN: true });
      return games; // Return games with ESPN odds
    }

    // Create a map of real-time odds by team matchup
    const oddsMap = new Map<string, ProcessedOdds>();
    realTimeOddsData.forEach(oddsGame => {
      const processed = processOddsData(oddsGame);
      if (processed) {
        // Create a key from team names (normalized)
        const key = createTeamMatchupKey(oddsGame.home_team, oddsGame.away_team);
        oddsMap.set(key, processed);
      }
    });

    // Enhance each game with real-time odds if available
    const enhancedGames = games.map(game => {
      const matchupKey = createTeamMatchupKey(game.homeTeam.name, game.awayTeam.name);
      const realTimeOdds = oddsMap.get(matchupKey);

      if (realTimeOdds) {
        // Replace ESPN odds with real-time odds
        return {
          ...game,
          odds: {
            source: realTimeOdds.bookmaker,
            updatedAt: realTimeOdds.lastUpdate,
            spread: realTimeOdds.spread ? {
              home: realTimeOdds.spread.home,
              away: realTimeOdds.spread.away,
              homeOdds: realTimeOdds.spread.homeOdds,
              awayOdds: realTimeOdds.spread.awayOdds,
            } : game.odds?.spread,
            total: realTimeOdds.total ? {
              line: realTimeOdds.total.line,
              over: realTimeOdds.total.over,
              under: realTimeOdds.total.under,
            } : game.odds?.total,
            moneyline: realTimeOdds.moneyline ? {
              home: realTimeOdds.moneyline.home,
              away: realTimeOdds.moneyline.away,
            } : game.odds?.moneyline,
          },
          // Regenerate prediction with new odds
          prediction: buildMarketDrivenPrediction(
            {
              source: realTimeOdds.bookmaker,
              updatedAt: realTimeOdds.lastUpdate,
              spread: realTimeOdds.spread ? {
                home: realTimeOdds.spread.home,
                away: realTimeOdds.spread.away,
                homeOdds: realTimeOdds.spread.homeOdds,
                awayOdds: realTimeOdds.spread.awayOdds,
              } : undefined,
              total: realTimeOdds.total ? {
                line: realTimeOdds.total.line,
                over: realTimeOdds.total.over,
                under: realTimeOdds.total.under,
              } : undefined,
              moneyline: realTimeOdds.moneyline ? {
                home: realTimeOdds.moneyline.home,
                away: realTimeOdds.moneyline.away,
              } : undefined,
            },
            game.homeTeam,
            game.awayTeam
          ),
        };
      }

      return game; // Return game with ESPN odds if no real-time odds found
    });

    logTelemetry('games_enhanced_with_real_time_odds', {
      league,
      totalGames: games.length,
      enhancedGames: enhancedGames.filter((_, i) => {
        const matchupKey = createTeamMatchupKey(games[i].homeTeam.name, games[i].awayTeam.name);
        return oddsMap.has(matchupKey);
      }).length,
    });

    return enhancedGames;
  } catch (error) {
    logTelemetryError('real_time_odds_enhancement_failed', error, { league });
    return games; // Fall back to ESPN odds on error
  }
}

/**
 * Create a normalized key for matching teams between ESPN and The Odds API
 * Handles variations in team names (e.g., "San Francisco 49ers" vs "49ers")
 */
function createTeamMatchupKey(team1: string, team2: string): string {
  const normalize = (name: string) => {
    return name
      .toLowerCase()
      .replace(/\s+/g, '')
      .replace(/[^a-z0-9]/g, '');
  };

  const normalized1 = normalize(team1);
  const normalized2 = normalize(team2);

  // Sort to ensure consistent key regardless of home/away order
  return [normalized1, normalized2].sort().join('_');
}

async function fetchLeagueGames(league: Sport): Promise<Game[]> {
  const path = ESPN_LEAGUE_PATHS[league];
  if (!path) {
    logTelemetry('espn_scoreboard_missing_path', { league });
    return [];
  }

  const cacheKey = generateCacheKey('espn', 'scoreboard', league);

  return cachedFetch(cacheKey, CACHE_TTL.GAME_LIST, async () => {
    const rateLimitResult = checkRateLimit(`espn-scoreboard-${league}`, 10);
    if (!rateLimitResult.allowed) {
      const error = new Error(`ESPN scoreboard rate limit exceeded for ${league}`);
      logTelemetry('espn_scoreboard_rate_limited', {
        league,
        remaining: rateLimitResult.remaining,
      });
      throw error;
    }

    const requestStart = Date.now();

    try {
      const response = await fetch(`${ESPN_API_ROOT}/${path}/scoreboard`, {
        next: { revalidate: 120 },
      });

      if (!response.ok) {
        throw new Error(`Scoreboard request failed with status ${response.status}`);
      }

      const data: any = await response.json();
      const events = Array.isArray(data?.events) ? data.events : [];

      logTelemetry('espn_scoreboard_fetch_success', {
        league,
        durationMs: Date.now() - requestStart,
        eventCount: events.length,
      });

      return events
        .map((event: any) => mapEventToGame(event, league))
        .filter(Boolean) as Game[];
    } catch (error) {
      logTelemetryError('espn_scoreboard_fetch_error', error, {
        league,
        durationMs: Date.now() - requestStart,
      });
      throw error;
    }
  });
}

function mapEventToGame(event: any, league: Sport): Game | null {
  const competition = event?.competitions?.[0];
  if (!competition) return null;

  const home = competition.competitors?.find((c: any) => c.homeAway === 'home');
  const away = competition.competitors?.find((c: any) => c.homeAway === 'away');

  if (!home?.team || !away?.team) return null;

  const statusState =
    competition?.status?.type?.state ??
    event?.status?.type?.state ??
    'pre';

  const status: Game['status'] =
    statusState === 'post'
      ? 'completed'
      : statusState === 'in'
      ? 'live'
      : 'scheduled';

  const isPreGame = status === 'scheduled';

  const homeTeam = mapTeam(home);
  const awayTeam = mapTeam(away);
  const rawOdds = competition?.odds?.[0];
  const odds = parseOdds(rawOdds);
  const featuredParlays = parseFeaturedParlays(rawOdds);
  const weather = parseWeather(event?.weather);
  const broadcasts = parseBroadcasts(competition?.broadcasts);
  const prediction = buildMarketDrivenPrediction(odds, homeTeam, awayTeam);

  return {
    id:
      event?.id?.toString() ??
      competition?.id?.toString() ??
      `${league}-${homeTeam.id}-${awayTeam.id}`,
    league,
    homeTeam,
    awayTeam,
    date: competition?.date ?? event?.date,
    status,
    homeScore: parseScore(home, isPreGame),
    awayScore: parseScore(away, isPreGame),
    venue: competition?.venue?.fullName,
    broadcasts,
    weather,
    odds,
    prediction,
    featuredParlays,
  };
}

function mapTeam(competitor: any): Team {
  const team = competitor?.team ?? {};

  return {
    id: team.id?.toString() ?? cryptoRandomId(),
    name: team.displayName ?? team.name ?? 'Unknown Team',
    abbreviation: team.abbreviation ?? '',
    logo: team.logo,
    record: extractRecordSummary(competitor?.records),
    conference: team.conference?.name,
    division: team.division?.name,
    rank:
      competitor?.curatedRank?.current ??
      competitor?.rank?.current ??
      undefined,
  };
}

function parseScore(competitor: any, isPreGame: boolean): number | undefined {
  if (!competitor) return undefined;
  const raw = competitor.score;
  if (raw === undefined || raw === null || raw === '') return undefined;
  const numeric = Number(raw);
  if (Number.isNaN(numeric)) return undefined;
  return isPreGame ? undefined : numeric;
}

function parseBroadcasts(broadcasts: any): string[] | undefined {
  if (!Array.isArray(broadcasts)) return undefined;

  const labels = broadcasts
    .map((broadcast: any) => {
      if (Array.isArray(broadcast?.names) && broadcast.names.length > 0) {
        return broadcast.names.join(', ');
      }
      return broadcast?.mediaType ?? broadcast?.type ?? null;
    })
    .filter(Boolean);

  return labels.length > 0 ? labels : undefined;
}

function parseWeather(weather: any): GameWeather | undefined {
  if (!weather) return undefined;

  const temperature =
    typeof weather.temperature === 'number' ? weather.temperature : undefined;
  const conditions = weather.displayValue ?? weather.shortText ?? undefined;
  const windSpeed = weather.wind?.speed ?? weather.windSpeed;
  const humidity =
    typeof weather.humidity === 'number' ? weather.humidity : undefined;

  const impactPoints = computeWeatherImpact({
    temperature,
    windSpeed,
    conditions,
  });

  return {
    temperature,
    conditions,
    windSpeed,
    humidity,
    impactPoints,
  };
}

function computeWeatherImpact(weather: {
  temperature?: number;
  windSpeed?: number;
  conditions?: string;
}): number | undefined {
  const { temperature, windSpeed, conditions } = weather;
  let impact = 0;

  if (typeof temperature === 'number') {
    if (temperature <= 32) impact += 2.5;
    else if (temperature <= 40) impact += 1.5;
    else if (temperature >= 90) impact += 1;
  }

  if (typeof windSpeed === 'number') {
    if (windSpeed >= 20) impact += 3;
    else if (windSpeed >= 12) impact += 1.5;
  }

  if (typeof conditions === 'string') {
    const lower = conditions.toLowerCase();
    if (lower.includes('rain') || lower.includes('snow')) {
      impact += 2;
    }
  }

  return impact > 0 ? Number(impact.toFixed(1)) : undefined;
}

function parseOdds(oddsData: any): Game['odds'] | undefined {
  if (!oddsData) return undefined;

  const spreadLine = toAmericanNumber(oddsData.pointSpread?.home?.close?.line ?? oddsData.spread);
  const totalLine = toAmericanNumber(oddsData.total?.over?.close?.line ?? oddsData.overUnder);
  const homeSpreadOdds = toAmericanNumber(oddsData.pointSpread?.home?.close?.odds ?? oddsData.homeTeamOdds?.spreadOdds);
  const awaySpreadOdds = toAmericanNumber(oddsData.pointSpread?.away?.close?.odds ?? oddsData.awayTeamOdds?.spreadOdds);
  const homeMoneyline = toAmericanNumber(oddsData.moneyline?.home?.close?.odds ?? oddsData.homeTeamOdds?.moneyLine);
  const awayMoneyline = toAmericanNumber(oddsData.moneyline?.away?.close?.odds ?? oddsData.awayTeamOdds?.moneyLine);
  const overOdds = toAmericanNumber(oddsData.total?.over?.close?.odds);
  const underOdds = toAmericanNumber(oddsData.total?.under?.close?.odds);

  const odds: Game['odds'] = {
    source: oddsData.provider?.name ?? 'ESPN BET',
    updatedAt: oddsData.lastUpdated ?? oddsData.moneyline?.home?.close?.lastUpdated,
    spread:
      spreadLine !== undefined
        ? {
            home: spreadLine,
            away: -spreadLine,
            homeOdds: homeSpreadOdds,
            awayOdds: awaySpreadOdds,
          }
        : undefined,
    moneyline:
      homeMoneyline !== undefined && awayMoneyline !== undefined
        ? {
            home: homeMoneyline,
            away: awayMoneyline,
          }
        : undefined,
    total:
      totalLine !== undefined
        ? {
            line: totalLine,
            over: overOdds,
            under: underOdds,
          }
        : undefined,
  };

  if (!odds.spread && !odds.moneyline && !odds.total) {
    return undefined;
  }

  return odds;
}

function parseFeaturedParlays(oddsData: any): FeaturedParlay[] | undefined {
  const bets = oddsData?.featuredBets;
  if (!Array.isArray(bets) || bets.length === 0) return undefined;

  const parlays: FeaturedParlay[] = bets
    .map((bet: any) => {
      const legs = Array.isArray(bet?.legs)
        ? bet.legs
            .map((leg: any) => {
              const selection = leg.selectionText ?? leg.displayName ?? 'Selection';
              const market = leg.marketText ?? leg.type ?? 'Leg';
              const desc = leg.points ? `${selection} ${leg.points}`.trim() : undefined;
              return {
                selection,
                market,
                odds: toAmericanNumber(leg.odds ?? leg.oddsAmerican),
                description: desc,
              };
            })
            .filter((leg: any) => leg.selection)
        : [];

      const odds = toAmericanNumber(bet?.odds);

      return {
        id: bet?.id ?? cryptoRandomId(),
        title: bet?.displayName ?? 'Featured Parlay',
        type: bet?.type,
        odds: odds ?? NaN,
        startTime: bet?.startTime,
        sourceUrl: bet?.url ?? bet?.link?.href,
        legs,
      } as FeaturedParlay;
    })
    .filter((parlay: FeaturedParlay) => parlay.legs.length > 0 && Number.isFinite(parlay.odds));

  return parlays.length > 0 ? parlays : undefined;
}

function buildMarketDrivenPrediction(
  odds: Game['odds'] | undefined,
  homeTeam: Team,
  awayTeam: Team
): Game['prediction'] | undefined {
  if (!odds) {
    return buildRecordFallbackPrediction(homeTeam, awayTeam);
  }

  const homeOdds = odds.moneyline?.home ?? odds.spread?.homeOdds;
  const awayOdds = odds.moneyline?.away ?? odds.spread?.awayOdds;

  if (homeOdds === undefined || awayOdds === undefined) {
    return buildRecordFallbackPrediction(homeTeam, awayTeam);
  }

  const homeProb = calculateImpliedProbability(homeOdds);
  const awayProb = calculateImpliedProbability(awayOdds);
  const winner = homeProb >= awayProb ? ('home' as const) : ('away' as const);
  const confidence = Math.round(Math.min(95, Math.max(homeProb, awayProb)));
  const diffFromCoinFlip = Math.abs(confidence - 50);

  const totalLine = odds.total?.line ?? 44;
  const spread = odds.spread?.home ?? 0;
  const expectedDiff = -spread; // convert to home advantage

  const projectedHome =
    (totalLine + expectedDiff) / 2;
  const projectedAway =
    (totalLine - expectedDiff) / 2;

  const prediction = {
    winner,
    confidence,
    predictedScore: {
      home: Math.max(0, Math.round(projectedHome)),
      away: Math.max(0, Math.round(projectedAway)),
    },
    factors: [
      {
        name: 'Market Spread Influence',
        impact: Math.min(30, Math.round(Math.abs(spread) * 4)),
      },
      {
        name: 'Moneyline Differential',
        impact: Math.min(40, Math.round(diffFromCoinFlip)),
      },
      {
        name: 'Projected Total Pace',
        impact: Math.min(30, Math.round(totalLine / 2)),
      },
    ],
    edge: Number((confidence - 50).toFixed(1)),
    hasStrongEdge: diffFromCoinFlip >= 12,
    notes: `Derived from ${odds.source ?? 'market'} moneyline & spread signals`,
  };

  return prediction;
}

function buildRecordFallbackPrediction(homeTeam: Team, awayTeam: Team): NonNullable<Game['prediction']> {
  const homeWins = parseRecordWins(homeTeam.record);
  const awayWins = parseRecordWins(awayTeam.record);
  const winner = homeWins >= awayWins ? ('home' as const) : ('away' as const);
  const confidence = Math.min(68, 52 + Math.abs(homeWins - awayWins) * 3);

  return {
    winner,
    confidence,
    predictedScore: {
      home: 27,
      away: 23,
    },
    factors: [
      { name: 'Record Differential', impact: Math.min(30, Math.abs(homeWins - awayWins) * 4) },
      { name: 'Home Field', impact: 15 },
      { name: 'Recent Form', impact: 20 },
    ],
    edge: Number((confidence - 50).toFixed(1)),
    hasStrongEdge: confidence >= 65,
    notes: 'Fallback prediction based on team records and home advantage',
  };
}

function extractRecordSummary(records: any): string | undefined {
  if (!Array.isArray(records) || records.length === 0) return undefined;
  const overall =
    records.find((record: any) => record?.type === 'total') ?? records[0];
  return overall?.summary ?? undefined;
}

function parseRecordWins(record?: string): number {
  if (!record) return 0;
  const [wins] = record.split('-');
  const numericWins = Number(wins);
  return Number.isNaN(numericWins) ? 0 : numericWins;
}

function cryptoRandomId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2);
}

/**
 * Mock fallback data to keep UI responsive if external sources fail.
 */
function generateMockGames(league: Sport): Game[] {
  const now = new Date();

  const mockTeams: Record<Sport, Team[]> = {
    NFL: [
      { id: 'nfl-1', name: 'Kansas City Chiefs', abbreviation: 'KC', record: '11-3' },
      { id: 'nfl-2', name: 'Buffalo Bills', abbreviation: 'BUF', record: '10-4' },
      { id: 'nfl-3', name: 'San Francisco 49ers', abbreviation: 'SF', record: '12-2' },
      { id: 'nfl-4', name: 'Miami Dolphins', abbreviation: 'MIA', record: '11-3' },
      { id: 'nfl-5', name: 'Philadelphia Eagles', abbreviation: 'PHI', record: '12-2' },
      { id: 'nfl-6', name: 'Dallas Cowboys', abbreviation: 'DAL', record: '10-4' },
    ],
    NCAAF: [
      { id: 'ncaaf-1', name: 'Georgia Bulldogs', abbreviation: 'UGA', conference: 'SEC', record: '12-0' },
      { id: 'ncaaf-2', name: 'Michigan Wolverines', abbreviation: 'MICH', conference: 'Big Ten', record: '12-0' },
      { id: 'ncaaf-3', name: 'Texas Longhorns', abbreviation: 'TEX', conference: 'Big 12', record: '11-1' },
      { id: 'ncaaf-4', name: 'Alabama Crimson Tide', abbreviation: 'ALA', conference: 'SEC', record: '11-1' },
      { id: 'ncaaf-5', name: 'Oregon Ducks', abbreviation: 'ORE', conference: 'Pac-12', record: '11-2' },
      { id: 'ncaaf-6', name: 'Florida State Seminoles', abbreviation: 'FSU', conference: 'ACC', record: '12-1' },
    ],
    TABLE_TENNIS: [
      { id: 'tt-1', name: 'Fan Zhendong', abbreviation: 'FZD', record: '15-2' },
      { id: 'tt-2', name: 'Ma Long', abbreviation: 'ML', record: '14-3' },
      { id: 'tt-3', name: 'Wang Chuqin', abbreviation: 'WCQ', record: '13-3' },
      { id: 'tt-4', name: 'Tomokazu Harimoto', abbreviation: 'TH', record: '12-4' },
      { id: 'tt-5', name: 'Hugo Calderano', abbreviation: 'HC', record: '11-5' },
      { id: 'tt-6', name: 'Truls Moregard', abbreviation: 'TM', record: '10-5' },
    ],
  };

  const selectedTeams = mockTeams[league] ?? mockTeams.NFL;
  const games: Game[] = [];

  for (let i = 0; i < selectedTeams.length; i += 2) {
    const homeTeam = selectedTeams[i];
    const awayTeam = selectedTeams[i + 1];
    if (!homeTeam || !awayTeam) continue;

    const daysAhead = i + 1;
    const gameDate = new Date(now.getTime() + daysAhead * 24 * 60 * 60 * 1000);

    const spread = i % 3 === 0 ? -3.5 : -5.5 + i;
    const total = 49.5;

      games.push({
      id: `${league.toLowerCase()}-mock-${i / 2 + 1}`,
      league,
        homeTeam,
        awayTeam,
        date: gameDate.toISOString(),
        status: 'scheduled',
      venue: `${homeTeam.abbreviation} Stadium`,
        odds: {
        source: 'Mockbook',
          spread: {
          home: spread,
          away: -spread,
            homeOdds: -110,
            awayOdds: -110,
          },
          moneyline: {
          home: -160,
          away: 140,
          },
          total: {
          line: total,
            over: -110,
            under: -110,
          },
        },
        prediction: {
        winner: 'home',
        confidence: 60,
          predictedScore: {
          home: 28,
          away: 23,
          },
          factors: [
          { name: 'Home Advantage', impact: 18 },
          { name: 'Recent Form', impact: 22 },
          { name: 'Market Signal', impact: 20 },
        ],
        edge: 10,
        hasStrongEdge: true,
        notes: 'Mock data fallback',
        },
      });
  }

  return games;
}
