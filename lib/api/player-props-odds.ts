/**
 * Player Props from The Odds API
 * Get real-time player props from Hard Rock Bet and other sportsbooks
 */

import axios from 'axios';

const ODDS_API_KEY = process.env.NEXT_PUBLIC_ODDS_API_KEY;
const BASE_URL = 'https://api.the-odds-api.com/v4';

export interface PlayerProp {
  id: string;
  playerId?: string;
  playerName: string;
  team: string;
  opponent: string;
  position: string;
  gameId: string;
  gameTime: Date;
  propType: string; // 'passing_yards', 'passing_tds', 'rushing_yards', etc.
  propDescription: string; // Human-readable
  line: number;
  overOdds: number;
  underOdds: number;
  sportsbook: string;
  lastUpdate: string;
}

export interface PlayerPropsResponse {
  success: boolean;
  sport: string;
  props: PlayerProp[];
  count: number;
  error?: string;
}

/**
 * Player prop market keys supported by The Odds API
 */
export const PROP_MARKETS = {
  // Passing props
  PLAYER_PASS_YDS: 'player_pass_yds',
  PLAYER_PASS_TDS: 'player_pass_tds',
  PLAYER_PASS_COMPLETIONS: 'player_pass_completions',
  PLAYER_PASS_ATTEMPTS: 'player_pass_attempts',
  PLAYER_PASS_INTERCEPTIONS: 'player_pass_interceptions',
  PLAYER_PASS_LONGEST_COMPLETION: 'player_pass_longest_completion',
  
  // Rushing props
  PLAYER_RUSH_YDS: 'player_rush_yds',
  PLAYER_RUSH_ATTEMPTS: 'player_rush_attempts',
  PLAYER_RUSH_LONGEST: 'player_rush_longest',
  
  // Receiving props
  PLAYER_RECEPTIONS: 'player_receptions',
  PLAYER_RECEPTION_YDS: 'player_reception_yds',
  PLAYER_RECEPTION_LONGEST: 'player_reception_longest',
  
  // Touchdown props
  PLAYER_ANYTIME_TD: 'player_anytime_td',
  PLAYER_FIRST_TD: 'player_first_td',
  PLAYER_LAST_TD: 'player_last_td',
  PLAYER_2_PLUS_TD: 'player_2+_td',
  
  // Combo props
  PLAYER_RUSH_RECEPTION_YDS: 'player_rush_reception_yds',
  
  // NBA props
  PLAYER_POINTS: 'player_points',
  PLAYER_REBOUNDS: 'player_rebounds',
  PLAYER_ASSISTS: 'player_assists',
  PLAYER_THREES: 'player_threes',
  PLAYER_BLOCKS: 'player_blocks',
  PLAYER_STEALS: 'player_steals',
  PLAYER_TURNOVERS: 'player_turnovers',
  PLAYER_POINTS_REBOUNDS_ASSISTS: 'player_points_rebounds_assists',
  PLAYER_BLOCKS_STEALS: 'player_blocks_steals',
  PLAYER_DOUBLE_DOUBLE: 'player_double_double',
  PLAYER_TRIPLE_DOUBLE: 'player_triple_double',
  
  // MLB props
  PLAYER_HITS: 'player_hits',
  PLAYER_TOTAL_BASES: 'player_total_bases',
  PLAYER_RUNS: 'player_runs',
  PLAYER_RBIS: 'player_rbis',
  PLAYER_HOME_RUNS: 'player_home_runs',
  PLAYER_STOLEN_BASES: 'player_stolen_bases',
  PLAYER_STRIKEOUTS: 'player_strikeouts',
  PLAYER_HITS_RUNS_RBIS: 'player_hits_runs_rbis',
  PITCHER_STRIKEOUTS: 'pitcher_strikeouts',
  PITCHER_HITS_ALLOWED: 'pitcher_hits_allowed',
  PITCHER_WALKS: 'pitcher_walks',
  PITCHER_EARNED_RUNS: 'pitcher_earned_runs',
} as const;

const SPORT_MARKETS: Record<'nfl' | 'ncaaf' | 'nba' | 'mlb', string[]> = {
  nfl: [
    PROP_MARKETS.PLAYER_PASS_YDS,
    PROP_MARKETS.PLAYER_PASS_TDS,
    PROP_MARKETS.PLAYER_PASS_COMPLETIONS,
    PROP_MARKETS.PLAYER_PASS_ATTEMPTS,
    PROP_MARKETS.PLAYER_PASS_INTERCEPTIONS,
    PROP_MARKETS.PLAYER_PASS_LONGEST_COMPLETION,
    PROP_MARKETS.PLAYER_RUSH_YDS,
    PROP_MARKETS.PLAYER_RUSH_ATTEMPTS,
    PROP_MARKETS.PLAYER_RECEPTIONS,
    PROP_MARKETS.PLAYER_RECEPTION_YDS,
    PROP_MARKETS.PLAYER_RECEPTION_LONGEST,
    PROP_MARKETS.PLAYER_ANYTIME_TD,
    PROP_MARKETS.PLAYER_RUSH_RECEPTION_YDS,
  ],
  ncaaf: [
    PROP_MARKETS.PLAYER_PASS_YDS,
    PROP_MARKETS.PLAYER_PASS_TDS,
    PROP_MARKETS.PLAYER_PASS_COMPLETIONS,
    PROP_MARKETS.PLAYER_PASS_ATTEMPTS,
    PROP_MARKETS.PLAYER_PASS_INTERCEPTIONS,
    PROP_MARKETS.PLAYER_RUSH_YDS,
    PROP_MARKETS.PLAYER_RUSH_ATTEMPTS,
    PROP_MARKETS.PLAYER_RECEPTIONS,
    PROP_MARKETS.PLAYER_RECEPTION_YDS,
    PROP_MARKETS.PLAYER_RECEPTION_LONGEST,
    PROP_MARKETS.PLAYER_ANYTIME_TD,
    PROP_MARKETS.PLAYER_RUSH_RECEPTION_YDS,
  ],
  nba: [
    PROP_MARKETS.PLAYER_POINTS,
    PROP_MARKETS.PLAYER_REBOUNDS,
    PROP_MARKETS.PLAYER_ASSISTS,
    PROP_MARKETS.PLAYER_THREES,
    PROP_MARKETS.PLAYER_BLOCKS,
    PROP_MARKETS.PLAYER_STEALS,
    PROP_MARKETS.PLAYER_TURNOVERS,
    PROP_MARKETS.PLAYER_POINTS_REBOUNDS_ASSISTS,
    PROP_MARKETS.PLAYER_BLOCKS_STEALS,
    PROP_MARKETS.PLAYER_DOUBLE_DOUBLE,
    PROP_MARKETS.PLAYER_TRIPLE_DOUBLE,
  ],
  mlb: [
    PROP_MARKETS.PLAYER_HITS,
    PROP_MARKETS.PLAYER_TOTAL_BASES,
    PROP_MARKETS.PLAYER_RUNS,
    PROP_MARKETS.PLAYER_RBIS,
    PROP_MARKETS.PLAYER_HOME_RUNS,
    PROP_MARKETS.PLAYER_STOLEN_BASES,
    PROP_MARKETS.PLAYER_STRIKEOUTS,
    PROP_MARKETS.PLAYER_HITS_RUNS_RBIS,
    PROP_MARKETS.PITCHER_STRIKEOUTS,
    PROP_MARKETS.PITCHER_HITS_ALLOWED,
    PROP_MARKETS.PITCHER_WALKS,
    PROP_MARKETS.PITCHER_EARNED_RUNS,
  ],
};

/**
 * Get all available player props for upcoming games
 */
export async function getAllPlayerProps(sport: 'nfl' | 'ncaaf' | 'nba' | 'mlb' = 'nfl'): Promise<PlayerPropsResponse> {
  try {
    const sportKeyMap = {
      nfl: 'americanfootball_nfl',
      ncaaf: 'americanfootball_ncaaf',
      nba: 'basketball_nba',
      mlb: 'baseball_mlb',
    };
    const sportKey = sportKeyMap[sport];
    
    const markets = (SPORT_MARKETS[sport] ?? []).join(',');
    
    const response = await axios.get(
      `${BASE_URL}/sports/${sportKey}/odds/`,
      {
        params: {
          apiKey: ODDS_API_KEY,
          regions: 'us',
          markets: markets,
          bookmakers: 'draftkings,fanduel,betmgm,hardrock', // Include Hard Rock Bet
          oddsFormat: 'american',
        },
        timeout: 10000,
      }
    );

    const props = transformOddsToProps(response.data, sport);

    return {
      success: true,
      sport,
      props,
      count: props.length,
    };
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 422) {
      console.warn('Player props API returned unsupported markets, falling back to empty result');
      return {
        success: true,
        sport,
        props: [],
        count: 0,
        error: error.response.data?.message,
      };
    }

    console.error('Error fetching player props:', error);
    
    if (axios.isAxiosError(error) && error.response) {
      return {
        success: false,
        sport,
        props: [],
        count: 0,
        error: error.response.data?.message || error.message,
      };
    }

    return {
      success: false,
      sport,
      props: [],
      count: 0,
      error: 'Failed to fetch player props',
    };
  }
}

/**
 * Get player props for a specific game
 */
export async function getGamePlayerProps(
  eventId: string,
  sport: 'nfl' | 'ncaaf' = 'nfl'
): Promise<PlayerPropsResponse> {
  try {
    const sportKey = sport === 'nfl' ? 'americanfootball_nfl' : 'americanfootball_ncaaf';
    const markets = (SPORT_MARKETS[sport] ?? []).join(',');
    
    const response = await axios.get(
      `${BASE_URL}/sports/${sportKey}/events/${eventId}/odds/`,
      {
        params: {
          apiKey: ODDS_API_KEY,
          regions: 'us',
          markets: markets,
          bookmakers: 'draftkings,fanduel,betmgm,hardrock',
          oddsFormat: 'american',
        },
        timeout: 10000,
      }
    );

    const props = transformOddsToProps([response.data], sport);

    return {
      success: true,
      sport,
      props,
      count: props.length,
    };
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 422) {
      console.warn('Game player props API returned unsupported markets, falling back to empty result');
      return {
        success: true,
        sport,
        props: [],
        count: 0,
        error: error.response.data?.message,
      };
    }

    console.error('Error fetching game props:', error);
    
    return {
      success: false,
      sport,
      props: [],
      count: 0,
      error: 'Failed to fetch game props',
    };
  }
}

/**
 * Get props for a specific player
 */
export async function getPlayerProps(
  playerName: string,
  sport: 'nfl' | 'ncaaf' = 'nfl'
): Promise<PlayerPropsResponse> {
  const allProps = await getAllPlayerProps(sport);
  
  if (!allProps.success) {
    return allProps;
  }

  const playerProps = allProps.props.filter(prop =>
    prop.playerName.toLowerCase().includes(playerName.toLowerCase())
  );

  return {
    ...allProps,
    props: playerProps,
    count: playerProps.length,
  };
}

/**
 * Transform The Odds API response to our prop format
 */
function transformOddsToProps(events: any[], sport: string): PlayerProp[] {
  const props: PlayerProp[] = [];

  events.forEach((event: any) => {
    if (!event.bookmakers || event.bookmakers.length === 0) {
      return;
    }

    event.bookmakers.forEach((bookmaker: any) => {
      bookmaker.markets?.forEach((market: any) => {
        const propType = market.key;
        const propDescription = formatPropDescription(propType);

        // Group outcomes by player (Over/Under pairs)
        const playerOutcomes: { [key: string]: any[] } = {};
        
        market.outcomes?.forEach((outcome: any) => {
          const playerKey = outcome.description || outcome.name;
          if (!playerOutcomes[playerKey]) {
            playerOutcomes[playerKey] = [];
          }
          playerOutcomes[playerKey].push(outcome);
        });

        // Create props for each player
        Object.entries(playerOutcomes).forEach(([playerKey, outcomes]) => {
          const overOutcome = outcomes.find(o => o.name === 'Over');
          const underOutcome = outcomes.find(o => o.name === 'Under');

          if (overOutcome || underOutcome) {
            const line = overOutcome?.point || underOutcome?.point || 0;
            
            props.push({
              id: `${event.id}-${bookmaker.key}-${propType}-${playerKey}`,
              playerName: extractPlayerName(playerKey),
              team: event.home_team, // Approximate - would need team mapping
              opponent: event.away_team,
              position: guessPosition(propType),
              gameId: event.id,
              gameTime: new Date(event.commence_time),
              propType,
              propDescription,
              line,
              overOdds: overOutcome?.price || 0,
              underOdds: underOutcome?.price || 0,
              sportsbook: bookmaker.title,
              lastUpdate: bookmaker.last_update,
            });
          }
        });
      });
    });
  });

  return props;
}

/**
 * Extract clean player name from description
 */
function extractPlayerName(description: string): string {
  // Remove common suffixes like position abbreviations
  return description
    .replace(/\s+(QB|RB|WR|TE|K|P|DEF)$/i, '')
    .replace(/\s+(Over|Under)$/i, '')
    .trim();
}

/**
 * Guess player position from prop type
 */
function guessPosition(propType: string): string {
  if (propType.includes('pass')) return 'QB';
  if (propType.includes('rush') && !propType.includes('reception')) return 'RB';
  if (propType.includes('reception') || propType.includes('receptions')) return 'WR';
  if (propType.includes('td')) return 'FLEX';
  return 'FLEX';
}

/**
 * Format prop type into human-readable description
 */
function formatPropDescription(propType: string): string {
  const descriptions: { [key: string]: string } = {
    'player_pass_yds': 'Passing Yards',
    'player_pass_tds': 'Passing Touchdowns',
    'player_pass_completions': 'Pass Completions',
    'player_pass_attempts': 'Pass Attempts',
    'player_pass_interceptions': 'Interceptions',
    'player_pass_longest_completion': 'Longest Completion',
    'player_rush_yds': 'Rushing Yards',
    'player_rush_attempts': 'Rush Attempts',
    'player_rush_longest': 'Longest Rush',
    'player_receptions': 'Receptions',
    'player_reception_yds': 'Receiving Yards',
    'player_reception_longest': 'Longest Reception',
    'player_anytime_td': 'Anytime Touchdown',
    'player_first_td': 'First Touchdown',
    'player_last_td': 'Last Touchdown',
    'player_2+_td': '2+ Touchdowns',
    'player_rush_reception_yds': 'Rush + Rec Yards',
  };

  return descriptions[propType] || propType.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

/**
 * Check API usage stats
 */
export async function checkApiUsage(): Promise<{
  requestsUsed: number;
  requestsRemaining: number;
}> {
  try {
    // The Odds API returns usage in response headers
    const response = await axios.get(
      `${BASE_URL}/sports`,
      {
        params: { apiKey: ODDS_API_KEY },
      }
    );

    return {
      requestsUsed: parseInt(response.headers['x-requests-used'] || '0'),
      requestsRemaining: parseInt(response.headers['x-requests-remaining'] || '500'),
    };
  } catch (error) {
    return {
      requestsUsed: 0,
      requestsRemaining: 0,
    };
  }
}

const PlayerPropsOddsAPI = {
  getAllPlayerProps,
  getGamePlayerProps,
  getPlayerProps,
  checkApiUsage,
  PROP_MARKETS,
};

export default PlayerPropsOddsAPI;

