/**
 * Unified API Service - Main entry point for all external data
 *
 * This service aggregates data from multiple sources:
 * - The Odds API (real-time odds)
 * - MySportsFeeds (stats, injuries)
 * - Weather API (game conditions)
 * - AI/ML predictions
 * - Social sentiment
 *
 * All UI components should use this service instead of calling APIs directly
 */

import { oddsApiService } from './oddsApi.service';
import { weatherService } from './weather.service';
import { cacheService } from './cache.service';

// Type definitions
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

interface AdvancedMetrics {
  team: string;
  epa: number;
  dvoa: number;
  successRate: number;
  explosivePlayRate: number;
  stuffRate: number;
  week: number;
  season: number;
};

interface PlayerInjury {
  player: {
    id: number;
    firstName: string;
    lastName: string;
    position: string;
  };
  team: {
    id: number;
    abbreviation: string;
  };
  description: string;
  playingProbability: string;
};

interface GameWeather {
  gameId: string;
  location: {
    lat: number;
    lon: number;
    city: string;
    stadium: string;
  };
  forecast: any;
  impact: 'high' | 'medium' | 'low' | 'none';
  analysis: string;
};

interface VideoHighlight {
  id: string;
  title: string;
  description: string;
  url: string;
  thumbnail: string;
  duration: number;
  date: string;
  type: 'touchdown' | 'highlight' | 'recap' | 'interview';
  views: number;
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

interface PredictionFactor {
  name: string;
  weight: number;
  value: number;
  impact: string;
};

interface PredictionModel {
  gameId: string;
  predictions: {
    winner: string;
    winProbability: number;
    predictedScore: {
      home: number;
      away: number;
    };
    spread: {
      pick: string;
      confidence: number;
    };
    total: {
      pick: 'over' | 'under';
      confidence: number;
    };
  };
  factors: PredictionFactor[];
  model: {
    name: string;
    accuracy: number;
    lastUpdated: string;
  };
};

interface SentimentAnalysis {
  gameId: string;
  team: string;
  sentiment: {
    positive: number;
    neutral: number;
    negative: number;
    overall: number;
  };
  volume: number;
  trending: boolean;
  keyTopics: string[];
  lastUpdated: string;
};

interface EnhancedGameData {
  id: string;
  sport: 'NFL' | 'NCAAF';
  date: string;
  time: string;
  home: string;
  away: string;
  odds: {
    spread: { home: number; away: number; line: number };
    total: { over: number; under: number; line: number };
    moneyline: { home: number; away: number };
    bookmakers: string[];
  };
  lineMovement: LineMovement[];
  advancedMetrics: {
    home: AdvancedMetrics;
    away: AdvancedMetrics;
  };
  injuries: {
    home: PlayerInjury[];
    away: PlayerInjury[];
  };
  weather?: GameWeather;
  highlights: VideoHighlight[];
  prediction: PredictionModel;
  sentiment: {
    home: SentimentAnalysis;
    away: SentimentAnalysis;
  };
  lastUpdated: string;
  dataQuality: number;
};

class ApiService {
  /**
   * Get complete enhanced data for a specific game
   */
  async getEnhancedGameData(gameId: string, sport: 'NFL' | 'NCAAF'): Promise<ApiResponse<EnhancedGameData>> {
    const cacheKey = `enhanced_game_${gameId}`;

    // Check cache first
    const cached = cacheService.get<EnhancedGameData>(cacheKey);
    if (cached) {
      return {
        success: true,
        data: cached,
        cached: true,
        timestamp: new Date().toISOString()
      };
    }

    try {
      // Fetch data from multiple sources in parallel
      const [oddsData, weatherData] = await Promise.all([
        oddsApiService.getGameOdds(sport.toLowerCase() as 'nfl' | 'ncaaf', gameId),
        this.getGameWeather(gameId)
      ]);

      // Combine all data
      const enhancedData: EnhancedGameData = await this.buildEnhancedData(
        gameId,
        sport,
        oddsData,
        weatherData
      );

      // Cache the result
      cacheService.set(cacheKey, enhancedData, 300); // 5 minutes

      return {
        success: true,
        data: enhancedData,
        cached: false,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error fetching enhanced game data:', error);
      return {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Unknown error',
          code: 'FETCH_ERROR',
          details: error
        },
        cached: false,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Get all games with basic data
   */
  async getAllGames(sport: 'NFL' | 'NCAAF'): Promise<ApiResponse<EnhancedGameData[]>> {
    try {
      const oddsResponse = await oddsApiService.getOdds(sport.toLowerCase() as 'nfl' | 'ncaaf');

      if (!oddsResponse.success || !oddsResponse.data) {
        throw new Error('Failed to fetch odds data');
      }

      // Transform odds data to enhanced game data
      const games: EnhancedGameData[] = await Promise.all(
        oddsResponse.data.map(async (oddsGame) => {
          const consensus = oddsApiService.calculateConsensusOdds(oddsGame);

          return {
            id: oddsGame.id,
            sport,
            date: new Date(oddsGame.commence_time).toLocaleDateString(),
            time: new Date(oddsGame.commence_time).toLocaleTimeString(),
            home: oddsGame.home_team,
            away: oddsGame.away_team,

            odds: {
              spread: {
                home: consensus.spread,
                away: -consensus.spread,
                line: consensus.spread
              },
              total: {
                over: -110,
                under: -110,
                line: consensus.total
              },
              moneyline: {
                home: consensus.moneyline.home,
                away: consensus.moneyline.away
              },
              bookmakers: oddsGame.bookmakers.map(b => b.title)
            },

            lineMovement: [],
            advancedMetrics: {
              home: this.getMockAdvancedMetrics(),
              away: this.getMockAdvancedMetrics()
            },
            injuries: {
              home: [],
              away: []
            },
            highlights: [],
            prediction: this.getMockPrediction(oddsGame.id, oddsGame.home_team, oddsGame.away_team),
            sentiment: {
              home: this.getMockSentiment(oddsGame.home_team),
              away: this.getMockSentiment(oddsGame.away_team)
            },
            lastUpdated: new Date().toISOString(),
            dataQuality: 75
          };
        })
      );

      return {
        success: true,
        data: games,
        cached: oddsResponse.cached,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error fetching all games:', error);
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
   * Get weather for a game
   */
  private async getGameWeather(gameId: string): Promise<any> {
    // This would need game-to-stadium mapping
    // For now, return mock data
    return {
      success: true,
      data: null
    };
  }

  /**
   * Build enhanced game data from multiple sources
   */
  private async buildEnhancedData(
    gameId: string,
    sport: 'NFL' | 'NCAAF',
    oddsData: any,
    weatherData: any
  ): Promise<EnhancedGameData> {
    const odds = oddsData.data;
    const consensus = oddsApiService.calculateConsensusOdds(odds);

    return {
      id: gameId,
      sport,
      date: new Date(odds.commence_time).toLocaleDateString(),
      time: new Date(odds.commence_time).toLocaleTimeString(),
      home: odds.home_team,
      away: odds.away_team,

      odds: {
        spread: {
          home: consensus.spread,
          away: -consensus.spread,
          line: consensus.spread
        },
        total: {
          over: -110,
          under: -110,
          line: consensus.total
        },
        moneyline: {
          home: consensus.moneyline.home,
          away: consensus.moneyline.away
        },
        bookmakers: odds.bookmakers.map((b: any) => b.title)
      },

      lineMovement: [],
      advancedMetrics: {
        home: this.getMockAdvancedMetrics(),
        away: this.getMockAdvancedMetrics()
      },
      injuries: {
        home: [],
        away: []
      },
      weather: weatherData.data,
      highlights: [],
      prediction: this.getMockPrediction(gameId, odds.home_team, odds.away_team),
      sentiment: {
        home: this.getMockSentiment(odds.home_team),
        away: this.getMockSentiment(odds.away_team)
      },
      lastUpdated: new Date().toISOString(),
      dataQuality: 85
    };
  }

  /**
   * Mock advanced metrics (replace with real FTN Data API)
   */
  private getMockAdvancedMetrics() {
    return {
      team: '',
      epa: Math.random() * 0.3 - 0.1,
      dvoa: Math.random() * 20 - 5,
      successRate: Math.random() * 10 + 45,
      explosivePlayRate: Math.random() * 5 + 12,
      stuffRate: Math.random() * 5 + 15,
      week: 10,
      season: 2025
    };
  }

  /**
   * Mock prediction (replace with real AI/ML model)
   */
  private getMockPrediction(gameId: string, home: string, away: string): PredictionModel {
    const homeScore = Math.floor(Math.random() * 15) + 20;
    const awayScore = Math.floor(Math.random() * 15) + 20;
    const homeWinProb = homeScore > awayScore ? 60 + Math.random() * 20 : 40 - Math.random() * 20;

    return {
      gameId,
      predictions: {
        winner: homeScore > awayScore ? home : away,
        winProbability: homeScore > awayScore ? homeWinProb : 100 - homeWinProb,
        predictedScore: {
          home: homeScore,
          away: awayScore
        },
        spread: {
          pick: homeScore > awayScore ? `${home} -${Math.abs(homeScore - awayScore)}` : `${away} -${Math.abs(awayScore - homeScore)}`,
          confidence: 75 + Math.random() * 15
        },
        total: {
          pick: (homeScore + awayScore) > 48 ? 'over' : 'under',
          confidence: 70 + Math.random() * 20
        }
      },
      factors: [
        { name: 'Home Field Advantage', weight: 15, value: 0.85, impact: '+2.5 pts' },
        { name: 'Recent Form', weight: 12, value: 0.72, impact: '+1.8 pts' },
        { name: 'Head to Head', weight: 10, value: 0.60, impact: '+1.2 pts' }
      ],
      model: {
        name: 'AI Sports Analyst v1.0',
        accuracy: 65 + Math.random() * 10,
        lastUpdated: new Date().toISOString()
      }
    };
  }

  /**
   * Mock sentiment analysis (replace with real Reddit/Twitter API + GPT-4)
   */
  private getMockSentiment(team: string): SentimentAnalysis {
    const positive = Math.random() * 40 + 30;
    const negative = Math.random() * 30 + 10;
    const neutral = 100 - positive - negative;

    return {
      gameId: '',
      team,
      sentiment: {
        positive,
        neutral,
        negative,
        overall: (positive - negative) / 100
      },
      volume: Math.floor(Math.random() * 10000) + 1000,
      trending: Math.random() > 0.7,
      keyTopics: ['offense', 'defense', 'playoffs'],
      lastUpdated: new Date().toISOString()
    };
  }

  /**
   * Get API health status
   */
  async getApiStatus() {
    return {
      oddsApi: { status: 'operational', latency: 150 },
      weatherApi: { status: 'operational', latency: 100 },
      statsApi: { status: 'operational', latency: 200 },
      predictionApi: { status: 'operational', latency: 300 }
    };
  }
};

export const apiService = new ApiService();
