/**
 * The Odds API Integration
 * Fetches live odds and game data from theoddsapi.com
 */

const ODDS_API_KEY = process.env.ODDS_API_KEY || '';
const ODDS_API_BASE = 'https://api.the-odds-api.com/v4';

export interface OddsAPIGame {
  id: string;
  sport_key: string;
  sport_title: string;
  commence_time: string;
  home_team: string;
  away_team: string;
  bookmakers: Array<{
    key: string;
    title: string;
    last_update: string;
    markets: Array<{
      key: string;
      last_update: string;
      outcomes: Array<{
        name: string;
        price: number;
        point?: number;
      }>;
    }>;
  }>;
}

export interface ParsedOdds {
  spread?: {
    home: number;
    away: number;
    homeOdds: number;
    awayOdds: number;
  };
  moneyline?: {
    home: number;
    away: number;
  };
  total?: {
    over: number;
    under: number;
    line: number;
  };
}

/**
 * Fetch upcoming games for a sport
 */
export async function fetchUpcomingGames(
  sportKey: 'americanfootball_nfl' | 'americanfootball_ncaaf',
  regions: string = 'us',
  markets: string = 'h2h,spreads,totals',
  oddsFormat: string = 'american'
): Promise<OddsAPIGame[]> {
  const url = `${ODDS_API_BASE}/sports/${sportKey}/odds/?` + new URLSearchParams({
    apiKey: ODDS_API_KEY,
    regions,
    markets,
    oddsFormat,
  });

  const response = await fetch(url);

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`The Odds API error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  return data;
}

/**
 * Parse bookmaker data to extract consensus odds
 */
export function parseOdds(bookmakers: OddsAPIGame['bookmakers']): ParsedOdds {
  if (!bookmakers || bookmakers.length === 0) {
    return {};
  }

  // Use first bookmaker (or could average across multiple)
  const bookmaker = bookmakers[0];
  const parsed: ParsedOdds = {};

  // Parse spreads
  const spreadsMarket = bookmaker.markets.find((m) => m.key === 'spreads');
  if (spreadsMarket && spreadsMarket.outcomes.length >= 2) {
    const homeOutcome = spreadsMarket.outcomes.find((o) => o.name === bookmaker.title);
    const awayOutcome = spreadsMarket.outcomes.find((o) => o.name !== bookmaker.title);

    if (homeOutcome && awayOutcome && homeOutcome.point !== undefined && awayOutcome.point !== undefined) {
      parsed.spread = {
        home: homeOutcome.point,
        away: awayOutcome.point,
        homeOdds: homeOutcome.price,
        awayOdds: awayOutcome.price,
      };
    }
  }

  // Parse moneyline
  const h2hMarket = bookmaker.markets.find((m) => m.key === 'h2h');
  if (h2hMarket && h2hMarket.outcomes.length >= 2) {
    const homeOutcome = h2hMarket.outcomes[0];
    const awayOutcome = h2hMarket.outcomes[1];

    parsed.moneyline = {
      home: homeOutcome.price,
      away: awayOutcome.price,
    };
  }

  // Parse totals
  const totalsMarket = bookmaker.markets.find((m) => m.key === 'totals');
  if (totalsMarket && totalsMarket.outcomes.length >= 2) {
    const overOutcome = totalsMarket.outcomes.find((o) => o.name === 'Over');
    const underOutcome = totalsMarket.outcomes.find((o) => o.name === 'Under');

    if (overOutcome && underOutcome && overOutcome.point !== undefined) {
      parsed.total = {
        over: overOutcome.price,
        under: underOutcome.price,
        line: overOutcome.point,
      };
    }
  }

  return parsed;
}

/**
 * Fetch all sports data (NFL + NCAAF)
 */
export async function fetchAllSportsData(): Promise<{
  nfl: OddsAPIGame[];
  ncaaf: OddsAPIGame[];
}> {
  const [nfl, ncaaf] = await Promise.all([
    fetchUpcomingGames('americanfootball_nfl'),
    fetchUpcomingGames('americanfootball_ncaaf'),
  ]);

  return { nfl, ncaaf };
}

/**
 * Get available sports from API
 */
export async function getAvailableSports() {
  const url = `${ODDS_API_BASE}/sports/?apiKey=${ODDS_API_KEY}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch sports: ${response.status}`);
  }

  return response.json();
}

/**
 * Check API quota/usage
 */
export async function checkAPIQuota() {
  const url = `${ODDS_API_BASE}/sports/?apiKey=${ODDS_API_KEY}`;
  const response = await fetch(url);

  const remainingRequests = response.headers.get('x-requests-remaining');
  const usedRequests = response.headers.get('x-requests-used');

  return {
    remaining: remainingRequests ? parseInt(remainingRequests) : null,
    used: usedRequests ? parseInt(usedRequests) : null,
  };
}
