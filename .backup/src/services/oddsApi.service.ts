import { API_CONFIG, CACHE_CONFIG } from '../config/api.config';
import { cacheService } from './cache.service';
import { rateLimiterService } from './rateLimiter.service';

// Type definitions
interface OddsResponse {
  id: string;
  sport_key: string;
  sport_title: string;
  commence_time: string;
  home_team: string;
  away_team: string;
  bookmakers: Bookmaker[];
};

interface Bookmaker {
  key: string;
  title: string;
  last_update: string;
  markets: Market[];
};

interface Market {
  key: string;
  outcomes: Outcome[];
};

interface Outcome {
  name: string;
  price: number;
  point?: number;
};

interface LineMovement {
  gameId: string;
  market: 'spread' | 'total' | 'moneyline';
  bookmaker: string;
  movements: {
    timestamp: string;
    value: number;
    change: number;
  }[];
  sharpMoney: 'home' | 'away' | 'neutral';
  publicPercentage: {
    home: number;
    away: number;
  };
  reverseLineMovement: boolean;
};

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code: string;
    details?: any;
  };
  cached: boolean;
  timestamp: string;
};

class OddsApiService {
  private baseUrl = API_CONFIG.theOddsApi.baseUrl;
  private apiKey = API_CONFIG.theOddsApi.apiKey;

  /**
   * Get live odds for a sport
   */
  async getOdds(sport: 'nfl' | 'ncaaf'): Promise<ApiResponse<OddsResponse[]>> {
    const cacheKey = `odds_${sport}`;

    // Check cache first
    const cached = cacheService.get<OddsResponse[]>(cacheKey);
    if (cached) {
      return {
        success: true,
        data: cached,
        cached: true,
        timestamp: new Date().toISOString()
      };
    }

    // Check rate limit
    const allowed = await rateLimiterService.checkLimit('theOddsApi');
    if (!allowed) {
      return {
        success: false,
        error: {
          message: 'Rate limit exceeded',
          code: 'RATE_LIMIT_EXCEEDED'
        },
        cached: false,
        timestamp: new Date().toISOString()
      };
    }

    try {
      const sportKey = API_CONFIG.theOddsApi.sports[sport];
      const url = `${this.baseUrl}/sports/${sportKey}/odds/?` + new URLSearchParams({
        apiKey: this.apiKey,
        regions: API_CONFIG.theOddsApi.regions,
        markets: API_CONFIG.theOddsApi.markets,
        oddsFormat: API_CONFIG.theOddsApi.oddsFormat
      });

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data: OddsResponse[] = await response.json();

      // Cache the result
      cacheService.set(cacheKey, data, CACHE_CONFIG.oddsCache);

      return {
        success: true,
        data,
        cached: false,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error fetching odds:', error);
      return {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Unknown error',
          code: 'FETCH_ERROR'
        },
        cached: false,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Get odds for a specific game
   */
  async getGameOdds(sport: 'nfl' | 'ncaaf', gameId: string): Promise<ApiResponse<OddsResponse>> {
    const oddsResponse = await this.getOdds(sport);

    if (!oddsResponse.success || !oddsResponse.data) {
      return {
        success: false,
        error: oddsResponse.error,
        cached: false,
        timestamp: new Date().toISOString()
      };
    }

    const game = oddsResponse.data.find(g => g.id === gameId);

    if (!game) {
      return {
        success: false,
        error: {
          message: 'Game not found',
          code: 'GAME_NOT_FOUND'
        },
        cached: false,
        timestamp: new Date().toISOString()
      };
    }

    return {
      success: true,
      data: game,
      cached: oddsResponse.cached,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Calculate consensus odds from multiple bookmakers
   */
  calculateConsensusOdds(game: OddsResponse) {
    const spreads: number[] = [];
    const totals: number[] = [];
    const moneylines: { home: number[], away: number[] } = { home: [], away: [] };

    game.bookmakers.forEach(bookmaker => {
      bookmaker.markets.forEach(market => {
        if (market.key === 'spreads') {
          const homeOutcome = market.outcomes.find(o => o.name === game.home_team);
          if (homeOutcome?.point) spreads.push(homeOutcome.point);
        } else if (market.key === 'totals') {
          const totalOutcome = market.outcomes[0];
          if (totalOutcome?.point) totals.push(totalOutcome.point);
        } else if (market.key === 'h2h') {
          market.outcomes.forEach(outcome => {
            if (outcome.name === game.home_team) moneylines.home.push(outcome.price);
            if (outcome.name === game.away_team) moneylines.away.push(outcome.price);
          });
        }
      });
    });

    const average = (arr: number[]) => arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;

    return {
      spread: average(spreads),
      total: average(totals),
      moneyline: {
        home: average(moneylines.home),
        away: average(moneylines.away)
      },
      bookmakerCount: game.bookmakers.length
    };
  }

  /**
   * Detect reverse line movement
   */
  detectReverseLineMovement(history: LineMovement[]): boolean {
    if (history.length < 2) return false;

    const latest = history[history.length - 1];
    const previous = history[history.length - 2];

    // Line moved toward one side while public is on the other
    const lineMovedHome = latest.movements[latest.movements.length - 1].value >
                          previous.movements[previous.movements.length - 1].value;

    const publicOnHome = latest.publicPercentage.home > 60;

    return (lineMovedHome && !publicOnHome) || (!lineMovedHome && publicOnHome);
  }

  /**
   * Get best odds across all bookmakers
   */
  getBestOdds(game: OddsResponse) {
    const bestOdds: Record<string, any> = {};

    game.bookmakers.forEach(bookmaker => {
      bookmaker.markets.forEach(market => {
        if (!bestOdds[market.key]) {
          bestOdds[market.key] = {};
        }

        market.outcomes.forEach(outcome => {
          const key = `${outcome.name}_${outcome.point || 'ml'}`;

          if (!bestOdds[market.key][key] || outcome.price > bestOdds[market.key][key].price) {
            bestOdds[market.key][key] = {
              bookmaker: bookmaker.title,
              price: outcome.price,
              point: outcome.point
            };
          }
        });
      });
    });

    return bestOdds;
  }
};

export const oddsApiService = new OddsApiService();
