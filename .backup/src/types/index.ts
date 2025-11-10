export type Sport = 'NFL' | 'NCAAF';
export type Confidence = 'High' | 'Medium' | 'Low';
export type BetType = 'spread' | 'moneyline' | 'over_under';

export interface Team {
  id: string;
  name: string;
  shortName: string;
  logo: string;
  color: string;
  secondaryColor: string;
}

export interface Game {
  id: string;
  sport: Sport;
  homeTeam: Team;
  awayTeam: Team;
  date: string;
  time: string;
  spread: number; // positive means home team favored
  overUnder: number;
  homeMoneyline: number;
  awayMoneyline: number;
  aiConfidence: Confidence;
  aiPrediction: {
    winner: 'home' | 'away';
    winProbability: number;
    spreadPick: 'home' | 'away';
    overUnderPick: 'over' | 'under';
    summary: string;
  };
  stats: GameStats;
}

export interface GameStats {
  homeTeam: TeamStats;
  awayTeam: TeamStats;
  weather?: {
    condition: string;
    temperature: number;
    windSpeed: number;
  };
}

export interface TeamStats {
  offenseRank: number;
  defenseRank: number;
  recentForm: string; // e.g., "W-W-L-W-W"
  injuries: string[];
  avgPointsScored: number;
  avgPointsAllowed: number;
}

export interface ParlayPick {
  gameId: string;
  game: Game;
  betType: BetType;
  pick: string;
  confidence: Confidence;
}

export interface Parlay {
  id: string;
  picks: ParlayPick[];
  combinedProbability: number;
  riskLevel: 'Conservative' | 'Moderate' | 'Aggressive';
  potentialPayout?: number;
}

export interface HistoricalRecord {
  date: string;
  sport: Sport;
  totalPredictions: number;
  correctPredictions: number;
  accuracy: number;
  byBetType: {
    spread: { total: number; correct: number; accuracy: number };
    moneyline: { total: number; correct: number; accuracy: number };
    overUnder: { total: number; correct: number; accuracy: number };
  };
}
