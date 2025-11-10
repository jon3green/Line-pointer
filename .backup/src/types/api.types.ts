// Type definitions for all API integrations

// The Odds API Types
export interface OddsResponse {
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
  key: string;
  outcomes: Outcome[];
}

export interface Outcome {
  name: string;
  price: number;
  point?: number;
}

// MySportsFeeds Types
export interface PlayerInjury {
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
}

export interface GameStats {
  game: {
    id: number;
    startTime: string;
    awayTeam: Team;
    homeTeam: Team;
  };
  stats: {
    passing: PassingStats;
    rushing: RushingStats;
    receiving: ReceivingStats;
  };
}

export interface Team {
  id: number;
  abbreviation: string;
  city: string;
  name: string;
}

export interface PassingStats {
  attempts: number;
  completions: number;
  yards: number;
  touchdowns: number;
  interceptions: number;
}

export interface RushingStats {
  attempts: number;
  yards: number;
  touchdowns: number;
}

export interface ReceivingStats {
  receptions: number;
  yards: number;
  touchdowns: number;
}

// FTN Data Types (Advanced Metrics)
export interface AdvancedMetrics {
  team: string;
  epa: number;
  dvoa: number;
  successRate: number;
  explosivePlayRate: number;
  stuffRate: number;
  week: number;
  season: number;
}

export interface TeamEfficiency {
  offense: AdvancedMetrics;
  defense: AdvancedMetrics;
  specialTeams: {
    fgEfficiency: number;
    puntAverage: number;
    returnYards: number;
  };
}

// Weather API Types
export interface WeatherData {
  temp: number;
  feels_like: number;
  humidity: number;
  wind_speed: number;
  wind_deg: number;
  weather: {
    main: string;
    description: string;
  }[];
  pop?: number; // Probability of precipitation
}

export interface GameWeather {
  gameId: string;
  location: {
    lat: number;
    lon: number;
    city: string;
    stadium: string;
  };
  forecast: WeatherData;
  impact: 'high' | 'medium' | 'low' | 'none';
  analysis: string;
}

// Video Highlights Types
export interface VideoHighlight {
  id: string;
  title: string;
  description: string;
  url: string;
  thumbnail: string;
  duration: number;
  date: string;
  type: 'touchdown' | 'highlight' | 'recap' | 'interview';
  views: number;
}

// AI Prediction Types
export interface PredictionModel {
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
}

export interface PredictionFactor {
  name: string;
  weight: number;
  value: number;
  impact: string;
}

// Social Sentiment Types
export interface SentimentAnalysis {
  gameId: string;
  team: string;
  sentiment: {
    positive: number;
    neutral: number;
    negative: number;
    overall: number; // -1 to 1
  };
  volume: number;
  trending: boolean;
  keyTopics: string[];
  lastUpdated: string;
}

export interface RedditPost {
  id: string;
  title: string;
  selftext: string;
  score: number;
  num_comments: number;
  created_utc: number;
  subreddit: string;
  author: string;
  url: string;
}

// Line Movement Types
export interface LineMovement {
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
}

// Enhanced Game Data (Combined)
export interface EnhancedGameData {
  id: string;
  sport: 'NFL' | 'NCAAF';
  date: string;
  time: string;
  home: string;
  away: string;

  // Real-time odds
  odds: {
    spread: { home: number; away: number; line: number };
    total: { over: number; under: number; line: number };
    moneyline: { home: number; away: number };
    bookmakers: string[];
  };

  // Line movement
  lineMovement: LineMovement[];

  // Advanced stats
  advancedMetrics: {
    home: AdvancedMetrics;
    away: AdvancedMetrics;
  };

  // Injuries
  injuries: {
    home: PlayerInjury[];
    away: PlayerInjury[];
  };

  // Weather
  weather?: GameWeather;

  // Video highlights
  highlights: VideoHighlight[];

  // AI prediction
  prediction: PredictionModel;

  // Social sentiment
  sentiment: {
    home: SentimentAnalysis;
    away: SentimentAnalysis;
  };

  // Meta
  lastUpdated: string;
  dataQuality: number; // 0-100
}

// Cache Entry Type
export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

// API Response Wrapper
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code: string;
    details?: any;
  };
  cached: boolean;
  timestamp: string;
}

// Rate Limiter State
export interface RateLimiterState {
  requests: number;
  windowStart: number;
  blocked: boolean;
}
