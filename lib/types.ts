export interface Team {
  id: string;
  name: string;
  abbreviation: string;
  logo?: string;
  record?: string;
  conference?: string;
  division?: string;
  rank?: number;
}

export type Sport = 'NFL' | 'NCAAF' | 'TABLE_TENNIS';

export interface GameWeather {
  temperature?: number;
  conditions?: string;
  windSpeed?: number;
  humidity?: number;
  impactPoints?: number;
}

export interface FeaturedParlayLeg {
  selection: string;
  market: string;
  odds?: number;
  description?: string;
}

export interface FeaturedParlay {
  id: string;
  title: string;
  type?: string;
  odds: number;
  startTime?: string;
  sourceUrl?: string;
  legs: FeaturedParlayLeg[];
}

export interface PlayerProp {
  playerId: string;
  playerName: string;
  team: string;
  propType: 'passing_yards' | 'rushing_yards' | 'receiving_yards' | 'touchdowns' | 'receptions' | 'passing_tds' | 'interceptions';
  line: number;
  overOdds: number;
  underOdds: number;
  prediction?: 'over' | 'under';
  confidence?: number;
}

export interface Game {
  id: string;
  league: Sport;
  homeTeam: Team;
  awayTeam: Team;
  date: string;
  status: 'scheduled' | 'live' | 'completed';
  homeScore?: number;
  awayScore?: number;
  venue?: string;
  broadcasts?: string[];
  weather?: GameWeather;
  featuredParlays?: FeaturedParlay[];
  playerProps?: PlayerProp[];
  odds?: {
    source?: string;
    updatedAt?: string;
    spread?: {
      home: number;
      away: number;
      homeOdds?: number;
      awayOdds?: number;
    };
    moneyline?: {
      home: number;
      away: number;
    };
    total?: {
      over?: number;
      under?: number;
      line: number;
    };
  };
  prediction?: {
    winner: 'home' | 'away';
    confidence: number;
    predictedScore: {
      home: number;
      away: number;
    };
    factors: {
      name: string;
      impact: number;
    }[];
    edge?: number;
    hasStrongEdge?: boolean;
    notes?: string;
  };
}

export interface ParlayLeg {
  gameId: string;
  game: Game;
  betType: 'spread' | 'moneyline' | 'total' | 'player_prop';
  selection: string;
  odds: number;
  probability: number;
  playerProp?: PlayerProp;
}

export interface Parlay {
  id: string;
  legs: ParlayLeg[];
  totalOdds: number;
  totalProbability: number;
  potentialPayout: number;
  stake: number;
}

export interface Stat {
  label: string;
  value: string | number;
  change?: number;
  trend?: 'up' | 'down' | 'neutral';
}

export interface MLPrediction {
  gameId: string;
  model: string;
  confidence: number;
  predictedWinner: 'home' | 'away';
  predictedSpread: number;
  predictedTotal: number;
  features: {
    [key: string]: number;
  };
}

export interface HistoricalTrend {
  teamId: string;
  games: number;
  wins: number;
  losses: number;
  avgPointsFor: number;
  avgPointsAgainst: number;
  atsRecord: string;
  overUnderRecord: string;
}

