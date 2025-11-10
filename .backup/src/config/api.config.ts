// API Configuration
// Add your API keys to .env.local file (not committed to git)

export const API_CONFIG = {
  // The Odds API - Real-time odds from 40+ bookmakers
  theOddsApi: {
    baseUrl: 'https://api.the-odds-api.com/v4',
    apiKey: import.meta.env.VITE_ODDS_API_KEY || 'demo_key',
    sports: {
      nfl: 'americanfootball_nfl',
      ncaaf: 'americanfootball_ncaaf'
    },
    regions: 'us',
    markets: 'spreads,totals,h2h',
    oddsFormat: 'american'
  },

  // MySportsFeeds - Comprehensive NFL/NCAAF data (FREE for personal use)
  mySportsFeeds: {
    baseUrl: 'https://api.mysportsfeeds.com/v2.1/pull',
    apiKey: import.meta.env.VITE_MSF_API_KEY || '',
    password: import.meta.env.VITE_MSF_PASSWORD || 'MYSPORTSFEEDS',
    version: '2.1'
  },

  // SportsDataIO - Professional sports data
  sportsDataIO: {
    baseUrl: 'https://api.sportsdata.io/v3',
    apiKey: import.meta.env.VITE_SPORTSDATA_API_KEY || '',
    nflKey: import.meta.env.VITE_SPORTSDATA_NFL_KEY || '',
    ncaafKey: import.meta.env.VITE_SPORTSDATA_NCAAF_KEY || ''
  },

  // FTN Data - Advanced metrics (EPA, DVOA)
  ftnData: {
    baseUrl: 'https://api.ftndata.com',
    apiKey: import.meta.env.VITE_FTN_API_KEY || ''
  },

  // OpenWeather API - Weather conditions
  openWeather: {
    baseUrl: 'https://api.openweathermap.org/data/2.5',
    apiKey: import.meta.env.VITE_OPENWEATHER_API_KEY || ''
  },

  // Highlightly - Video highlights
  highlightly: {
    baseUrl: 'https://highlightly.net/api',
    apiKey: import.meta.env.VITE_HIGHLIGHTLY_API_KEY || ''
  },

  // Sportmonks - AI Predictions
  sportmonks: {
    baseUrl: 'https://api.sportmonks.com/v3/football',
    apiKey: import.meta.env.VITE_SPORTMONKS_API_KEY || ''
  },

  // OpticOdds - Premium odds service
  opticOdds: {
    baseUrl: 'https://api.opticodds.com/api/v3',
    apiKey: import.meta.env.VITE_OPTICODDS_API_KEY || ''
  },

  // Reddit API for sentiment analysis
  reddit: {
    baseUrl: 'https://www.reddit.com',
    clientId: import.meta.env.VITE_REDDIT_CLIENT_ID || '',
    clientSecret: import.meta.env.VITE_REDDIT_CLIENT_SECRET || '',
    userAgent: 'AI Sports Analyst/1.0'
  },

  // OpenAI for sentiment analysis and predictions
  openai: {
    apiKey: import.meta.env.VITE_OPENAI_API_KEY || '',
    model: 'gpt-4-turbo-preview'
  }
};

// Cache configuration
export const CACHE_CONFIG = {
  oddsCache: 60, // 1 minute
  statsCache: 300, // 5 minutes
  injuryCache: 180, // 3 minutes
  weatherCache: 1800, // 30 minutes
  highlightsCache: 3600, // 1 hour
  predictionsCache: 600 // 10 minutes
};

// Rate limiting configuration
export const RATE_LIMITS = {
  theOddsApi: { requests: 500, window: 86400000 }, // 500/day
  mySportsFeeds: { requests: 1000, window: 86400000 }, // 1000/day
  openWeather: { requests: 60, window: 60000 }, // 60/min
  openai: { requests: 100, window: 60000 } // 100/min
};
