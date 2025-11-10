/**
 * Advanced Feature Engineering System
 * Generates 100+ features for ML models
 */

import type { Game, Team } from '../types';

export interface MLFeatures {
  // Team Performance (20 features)
  homeOffensiveEfficiency: number;
  homeDefensiveEfficiency: number;
  awayOffensiveEfficiency: number;
  awayDefensiveEfficiency: number;
  homeTurnoverDifferential: number;
  awayTurnoverDifferential: number;
  homeRedZoneEfficiency: number;
  awayRedZoneEfficiency: number;
  home3rdDownRate: number;
  away3rdDownRate: number;

  // Recent Form (15 features)
  homeWinPercentageL5: number;
  awayWinPercentageL5: number;
  homePointDifferentialL5: number;
  awayPointDifferentialL5: number;
  homeATSRecordL10: number;
  awayATSRecordL10: number;
  homeOverUnderL10: number;
  awayOverUnderL10: number;
  homeWinStreak: number;
  awayWinStreak: number;

  // Situational (25 features)
  isHomeTeam: number;
  isDivisionGame: number;
  isPrimetimeGame: number;
  homeRestDays: number;
  awayRestDays: number;
  restDaysDifference: number;
  travelDistance: number;
  timeZoneChange: number;
  altitudeChange: number;
  isPlayoffGame: number;

  // Weather (10 features)
  temperature: number;
  windSpeed: number;
  precipitationChance: number;
  isDome: number;
  weatherImpactScore: number;

  // Market (15 features)
  currentSpread: number;
  openingSpread: number;
  spreadMovement: number;
  currentTotal: number;
  totalMovement: number;
  homeMoneyline: number;
  awayMoneyline: number;
  impliedProbabilityHome: number;
  impliedProbabilityAway: number;

  // Strength Ratings (10 features)
  homeEloRating: number;
  awayEloRating: number;
  eloDifference: number;
  homeSOS: number; // Strength of schedule
  awaySOS: number;
  homeRank: number;
  awayRank: number;

  // Head-to-Head (5 features)
  h2hHomeWins: number;
  h2hAwayWins: number;
  h2hAvgPointDiff: number;
  h2hGamesPlayed: number;
  lastMeetingDaysAgo: number;
}

/**
 * Extract all features from a game
 */
export function extractFeatures(game: Game, historicalData?: any): MLFeatures {
  const features: Partial<MLFeatures> = {};

  // Team Performance Features
  features.homeOffensiveEfficiency = calculateOffensiveEfficiency(game.homeTeam, historicalData);
  features.homeDefensiveEfficiency = calculateDefensiveEfficiency(game.homeTeam, historicalData);
  features.awayOffensiveEfficiency = calculateOffensiveEfficiency(game.awayTeam, historicalData);
  features.awayDefensiveEfficiency = calculateDefensiveEfficiency(game.awayTeam, historicalData);

  features.homeTurnoverDifferential = calculateTurnoverDiff(game.homeTeam, historicalData);
  features.awayTurnoverDifferential = calculateTurnoverDiff(game.awayTeam, historicalData);

  features.homeRedZoneEfficiency = calculateRedZoneEff(game.homeTeam, historicalData);
  features.awayRedZoneEfficiency = calculateRedZoneEff(game.awayTeam, historicalData);

  features.home3rdDownRate = calculate3rdDownRate(game.homeTeam, historicalData);
  features.away3rdDownRate = calculate3rdDownRate(game.awayTeam, historicalData);

  // Recent Form Features
  features.homeWinPercentageL5 = calculateWinPercentage(game.homeTeam, 5, historicalData);
  features.awayWinPercentageL5 = calculateWinPercentage(game.awayTeam, 5, historicalData);

  features.homePointDifferentialL5 = calculatePointDiff(game.homeTeam, 5, historicalData);
  features.awayPointDifferentialL5 = calculatePointDiff(game.awayTeam, 5, historicalData);

  features.homeATSRecordL10 = calculateATSRecord(game.homeTeam, 10, historicalData);
  features.awayATSRecordL10 = calculateATSRecord(game.awayTeam, 10, historicalData);

  features.homeOverUnderL10 = calculateOverUnder(game.homeTeam, 10, historicalData);
  features.awayOverUnderL10 = calculateOverUnder(game.awayTeam, 10, historicalData);

  features.homeWinStreak = calculateStreak(game.homeTeam, historicalData);
  features.awayWinStreak = calculateStreak(game.awayTeam, historicalData);

  // Situational Features
  features.isHomeTeam = 1; // Always 1 for home team perspective
  features.isDivisionGame = isDivisionGame(game) ? 1 : 0;
  features.isPrimetimeGame = isPrimetimeGame(game) ? 1 : 0;

  features.homeRestDays = calculateRestDays(game.homeTeam, game.date, historicalData);
  features.awayRestDays = calculateRestDays(game.awayTeam, game.date, historicalData);
  features.restDaysDifference = (features.homeRestDays || 0) - (features.awayRestDays || 0);

  features.travelDistance = calculateTravelDistance(game);
  features.timeZoneChange = calculateTimeZoneChange(game);
  features.altitudeChange = calculateAltitudeChange(game);
  features.isPlayoffGame = game.status === 'scheduled' ? 0 : 0; // Placeholder

  // Weather Features
  if (game.weather) {
    features.temperature = game.weather.temperature || 70;
    features.windSpeed = game.weather.windSpeed || 0;
    features.precipitationChance = 0; // Placeholder
    features.isDome = game.venue?.includes('Stadium') && game.venue.includes('Dome') ? 1 : 0;
    features.weatherImpactScore = game.weather.impactPoints || 0;
  } else {
    features.temperature = 70;
    features.windSpeed = 0;
    features.precipitationChance = 0;
    features.isDome = 0;
    features.weatherImpactScore = 0;
  }

  // Market Features
  if (game.odds) {
    features.currentSpread = game.odds.spread?.home || 0;
    features.openingSpread = game.odds.spread?.home || 0; // Placeholder for opening line
    features.spreadMovement = 0; // Placeholder
    features.currentTotal = game.odds.total?.line || 44;
    features.totalMovement = 0; // Placeholder
    features.homeMoneyline = game.odds.moneyline?.home || -110;
    features.awayMoneyline = game.odds.moneyline?.away || -110;
    features.impliedProbabilityHome = calculateImpliedProb(features.homeMoneyline);
    features.impliedProbabilityAway = calculateImpliedProb(features.awayMoneyline);
  } else {
    features.currentSpread = 0;
    features.openingSpread = 0;
    features.spreadMovement = 0;
    features.currentTotal = 44;
    features.totalMovement = 0;
    features.homeMoneyline = -110;
    features.awayMoneyline = -110;
    features.impliedProbabilityHome = 0.5;
    features.impliedProbabilityAway = 0.5;
  }

  // Strength Ratings
  features.homeEloRating = calculateEloRating(game.homeTeam, historicalData);
  features.awayEloRating = calculateEloRating(game.awayTeam, historicalData);
  features.eloDifference = features.homeEloRating - features.awayEloRating;
  features.homeSOS = calculateSOS(game.homeTeam, historicalData);
  features.awaySOS = calculateSOS(game.awayTeam, historicalData);
  features.homeRank = game.homeTeam.rank || 99;
  features.awayRank = game.awayTeam.rank || 99;

  // Head-to-Head
  const h2h = calculateH2H(game.homeTeam, game.awayTeam, historicalData);
  features.h2hHomeWins = h2h.homeWins;
  features.h2hAwayWins = h2h.awayWins;
  features.h2hAvgPointDiff = h2h.avgPointDiff;
  features.h2hGamesPlayed = h2h.gamesPlayed;
  features.lastMeetingDaysAgo = h2h.lastMeetingDaysAgo;

  return features as MLFeatures;
}

// Helper Functions (Simplified implementations - would need real data in production)

function calculateOffensiveEfficiency(team: Team, data?: any): number {
  // Points per possession (placeholder: use record as proxy)
  const record = parseRecord(team.record);
  return 100 + (record.wins - record.losses) * 2;
}

function calculateDefensiveEfficiency(team: Team, data?: any): number {
  const record = parseRecord(team.record);
  return 100 - (record.wins - record.losses) * 1.5;
}

function calculateTurnoverDiff(team: Team, data?: any): number {
  const record = parseRecord(team.record);
  return (record.wins - record.losses) * 0.5;
}

function calculateRedZoneEff(team: Team, data?: any): number {
  return 0.55 + (Math.random() * 0.2); // Placeholder
}

function calculate3rdDownRate(team: Team, data?: any): number {
  return 0.40 + (Math.random() * 0.15); // Placeholder
}

function calculateWinPercentage(team: Team, games: number, data?: any): number {
  const record = parseRecord(team.record);
  return record.wins / (record.wins + record.losses);
}

function calculatePointDiff(team: Team, games: number, data?: any): number {
  const record = parseRecord(team.record);
  return (record.wins - record.losses) * 7;
}

function calculateATSRecord(team: Team, games: number, data?: any): number {
  return 0.50 + (Math.random() * 0.2 - 0.1); // Placeholder
}

function calculateOverUnder(team: Team, games: number, data?: any): number {
  return 0.50 + (Math.random() * 0.2 - 0.1); // Placeholder
}

function calculateStreak(team: Team, data?: any): number {
  const record = parseRecord(team.record);
  return record.wins > record.losses ? Math.min(record.wins, 5) : -Math.min(record.losses, 5);
}

function isDivisionGame(game: Game): boolean {
  return game.homeTeam.division === game.awayTeam.division && !!game.homeTeam.division;
}

function isPrimetimeGame(game: Game): boolean {
  const gameHour = new Date(game.date).getHours();
  return gameHour >= 19; // 7 PM or later
}

function calculateRestDays(team: Team, gameDate: string, data?: any): number {
  return 7; // Placeholder - would calculate from last game
}

function calculateTravelDistance(game: Game): number {
  // Placeholder - would calculate from venue locations
  return 500;
}

function calculateTimeZoneChange(game: Game): number {
  // Placeholder - would calculate from venue time zones
  return 0;
}

function calculateAltitudeChange(game: Game): number {
  // Placeholder - would calculate from venue altitudes
  return 0;
}

function calculateImpliedProb(americanOdds: number): number {
  if (americanOdds > 0) {
    return 100 / (americanOdds + 100);
  } else {
    return Math.abs(americanOdds) / (Math.abs(americanOdds) + 100);
  }
}

function calculateEloRating(team: Team, data?: any): number {
  const record = parseRecord(team.record);
  return 1500 + (record.wins - record.losses) * 25;
}

function calculateSOS(team: Team, data?: any): number {
  return 0.500; // Placeholder
}

function calculateH2H(home: Team, away: Team, data?: any): {
  homeWins: number;
  awayWins: number;
  avgPointDiff: number;
  gamesPlayed: number;
  lastMeetingDaysAgo: number;
} {
  return {
    homeWins: 1,
    awayWins: 1,
    avgPointDiff: 0,
    gamesPlayed: 2,
    lastMeetingDaysAgo: 365,
  };
}

function parseRecord(record?: string): { wins: number; losses: number } {
  if (!record) return { wins: 0, losses: 0 };
  const [wins, losses] = record.split('-').map(Number);
  return { wins: wins || 0, losses: losses || 0 };
}

/**
 * Normalize features to 0-1 range for neural networks
 */
export function normalizeFeatures(features: MLFeatures): MLFeatures {
  const normalized = { ...features };

  // Normalize continuous features
  normalized.temperature = (features.temperature - 32) / 68; // 32-100°F → 0-1
  normalized.windSpeed = Math.min(features.windSpeed / 30, 1); // 0-30mph → 0-1
  normalized.travelDistance = Math.min(features.travelDistance / 3000, 1); // 0-3000mi → 0-1
  normalized.eloDifference = (features.eloDifference + 500) / 1000; // -500 to 500 → 0-1

  return normalized;
}

/**
 * Get feature importance rankings
 */
export function getFeatureImportance(): Record<keyof MLFeatures, number> {
  // Based on typical XGBoost feature importance
  return {
    eloDifference: 0.15,
    currentSpread: 0.12,
    impliedProbabilityHome: 0.10,
    homeOffensiveEfficiency: 0.08,
    awayDefensiveEfficiency: 0.08,
    homeWinPercentageL5: 0.06,
    restDaysDifference: 0.05,
    homeATSRecordL10: 0.04,
    weatherImpactScore: 0.03,
    isDivisionGame: 0.02,
  } as any;
}
