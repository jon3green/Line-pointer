/**
 * Bayesian Confidence Updating System
 *
 * Dynamically adjusts prediction confidence based on model's
 * historical performance in specific situations
 *
 * Example: If model is only 60% accurate on night games,
 * reduce confidence by 10% for all night game predictions
 *
 * Features:
 * - Situational confidence modifiers
 * - Continuous learning from results
 * - Confidence bounds (never below 50% or above 95%)
 * - Context-aware adjustments
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface ConfidenceModifier {
  situation: string;
  modifier: number; // Multiplier (e.g., 0.9 = reduce by 10%)
  basedOnGames: number;
  historicalAccuracy: number;
  expectedAccuracy: number;
  confidence: 'high' | 'medium' | 'low'; // How confident we are in this modifier
}

export interface BayesianUpdate {
  originalConfidence: number;
  adjustedConfidence: number;
  modifiersApplied: ConfidenceModifier[];
  totalAdjustment: number;
  reasoning: string[];
}

/**
 * Calculate confidence modifiers from historical performance
 */
export async function calculateModifiers(sport: string): Promise<ConfidenceModifier[]> {
  console.log(`[Bayesian] Calculating modifiers for ${sport}...`);

  const modifiers: ConfidenceModifier[] = [];

  // Get predictions from last 3 months with at least 20 samples
  const threeMonthsAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

  const allPredictions = await prisma.prediction.findMany({
    where: {
      sport,
      wasCorrect: { not: null },
      createdAt: { gte: threeMonthsAgo },
    },
    select: {
      confidence: true,
      wasCorrect: true,
      gameTime: true,
      factors: true,
    },
  });

  // ===== SITUATION 1: NIGHT GAMES (Prime Time) =====
  const nightGames = allPredictions.filter(p => {
    const hour = new Date(p.gameTime).getHours();
    return hour >= 19; // 7pm or later
  });

  if (nightGames.length >= 20) {
    const nightAccuracy = (nightGames.filter(p => p.wasCorrect).length / nightGames.length) * 100;
    const expectedAccuracy = nightGames.reduce((sum, p) => sum + p.confidence, 0) / nightGames.length;
    const accuracyDelta = nightAccuracy - expectedAccuracy;

    if (Math.abs(accuracyDelta) > 3) {
      modifiers.push({
        situation: 'Night Game (Prime Time)',
        modifier: 1 + accuracyDelta / 100, // e.g., -5% → 0.95 multiplier
        basedOnGames: nightGames.length,
        historicalAccuracy: nightAccuracy,
        expectedAccuracy,
        confidence: nightGames.length > 50 ? 'high' : 'medium',
      });
    }
  }

  // ===== SITUATION 2: DIVISION GAMES =====
  const divisionGames = allPredictions.filter(p => {
    // TODO: Parse factors JSON to check isDivisionGame
    return false; // Placeholder
  });

  if (divisionGames.length >= 20) {
    const divAccuracy = (divisionGames.filter(p => p.wasCorrect).length / divisionGames.length) * 100;
    const expectedAccuracy = divisionGames.reduce((sum, p) => sum + p.confidence, 0) / divisionGames.length;
    const accuracyDelta = divAccuracy - expectedAccuracy;

    if (Math.abs(accuracyDelta) > 3) {
      modifiers.push({
        situation: 'Division Game',
        modifier: 1 + accuracyDelta / 100,
        basedOnGames: divisionGames.length,
        historicalAccuracy: divAccuracy,
        expectedAccuracy,
        confidence: divisionGames.length > 40 ? 'high' : 'medium',
      });
    }
  }

  // ===== SITUATION 3: HIGH SPREAD GAMES (>10 points) =====
  const blowoutGames = allPredictions.filter(p => {
    // TODO: Parse factors and check currentSpread > 10
    return false; // Placeholder
  });

  if (blowoutGames.length >= 15) {
    const blowoutAccuracy = (blowoutGames.filter(p => p.wasCorrect).length / blowoutGames.length) * 100;
    const expectedAccuracy = blowoutGames.reduce((sum, p) => sum + p.confidence, 0) / blowoutGames.length;
    const accuracyDelta = blowoutAccuracy - expectedAccuracy;

    if (Math.abs(accuracyDelta) > 3) {
      modifiers.push({
        situation: 'Large Spread (>10 pts)',
        modifier: 1 + accuracyDelta / 100,
        basedOnGames: blowoutGames.length,
        historicalAccuracy: blowoutAccuracy,
        expectedAccuracy,
        confidence: 'medium',
      });
    }
  }

  // ===== SITUATION 4: WEATHER GAMES (Temperature < 35°F or Wind > 20mph) =====
  const weatherGames = allPredictions.filter(p => {
    // TODO: Parse factors and check temperature or windSpeed
    return false; // Placeholder
  });

  if (weatherGames.length >= 10) {
    const weatherAccuracy = (weatherGames.filter(p => p.wasCorrect).length / weatherGames.length) * 100;
    const expectedAccuracy = weatherGames.reduce((sum, p) => sum + p.confidence, 0) / weatherGames.length;
    const accuracyDelta = weatherAccuracy - expectedAccuracy;

    if (Math.abs(accuracyDelta) > 5) {
      modifiers.push({
        situation: 'Severe Weather Game',
        modifier: 1 + accuracyDelta / 100,
        basedOnGames: weatherGames.length,
        historicalAccuracy: weatherAccuracy,
        expectedAccuracy,
        confidence: weatherGames.length > 20 ? 'medium' : 'low',
      });
    }
  }

  // ===== SITUATION 5: SHORT REST GAMES (<6 days) =====
  const shortRestGames = allPredictions.filter(p => {
    // TODO: Parse factors and check restDaysDifference
    return false; // Placeholder
  });

  if (shortRestGames.length >= 15) {
    const shortRestAccuracy = (shortRestGames.filter(p => p.wasCorrect).length / shortRestGames.length) * 100;
    const expectedAccuracy = shortRestGames.reduce((sum, p) => sum + p.confidence, 0) / shortRestGames.length;
    const accuracyDelta = shortRestAccuracy - expectedAccuracy;

    if (Math.abs(accuracyDelta) > 3) {
      modifiers.push({
        situation: 'Short Rest Game',
        modifier: 1 + accuracyDelta / 100,
        basedOnGames: shortRestGames.length,
        historicalAccuracy: shortRestAccuracy,
        expectedAccuracy,
        confidence: shortRestGames.length > 30 ? 'high' : 'medium',
      });
    }
  }

  // ===== SITUATION 6: CONFERENCE CHAMPIONSHIP GAMES =====
  // TODO: Add championship/playoff game modifier

  // ===== SITUATION 7: REVENGE GAMES =====
  // TODO: Add revenge game modifier (lost last meeting)

  console.log(`[Bayesian] Calculated ${modifiers.length} modifiers`);

  return modifiers;
}

/**
 * Apply Bayesian updates to a prediction confidence
 */
export async function applyBayesianUpdate(
  initialConfidence: number,
  gameContext: any,
  sport: string
): Promise<BayesianUpdate> {
  console.log(`[Bayesian] Applying updates to ${initialConfidence}% confidence`);

  // Get calculated modifiers
  const modifiers = await calculateModifiers(sport);

  const applicableModifiers: ConfidenceModifier[] = [];
  const reasoning: string[] = [];

  let adjustedConfidence = initialConfidence;

  // Apply each applicable modifier
  for (const modifier of modifiers) {
    let applies = false;

    // Check if this modifier applies to current game
    if (modifier.situation.includes('Night Game')) {
      const gameHour = new Date(gameContext.gameTime).getHours();
      applies = gameHour >= 19;
    } else if (modifier.situation.includes('Division Game')) {
      applies = gameContext.isDivisionGame === true;
    } else if (modifier.situation.includes('Large Spread')) {
      applies = Math.abs(gameContext.currentSpread || 0) > 10;
    } else if (modifier.situation.includes('Weather')) {
      applies = (gameContext.temperature < 35 || gameContext.windSpeed > 20);
    } else if (modifier.situation.includes('Short Rest')) {
      applies = Math.abs(gameContext.restDaysDifference || 0) >= 2;
    }

    if (applies) {
      applicableModifiers.push(modifier);

      // Apply modifier
      adjustedConfidence *= modifier.modifier;

      // Add reasoning
      const change = ((modifier.modifier - 1) * 100).toFixed(1);
      reasoning.push(
        `${modifier.situation}: ${change > '0' ? '+' : ''}${change}% (based on ${modifier.basedOnGames} games, ${modifier.historicalAccuracy.toFixed(1)}% actual vs ${modifier.expectedAccuracy.toFixed(1)}% expected)`
      );
    }
  }

  // Apply confidence bounds (50% - 95%)
  const boundedConfidence = Math.max(50, Math.min(95, adjustedConfidence));

  const totalAdjustment = boundedConfidence - initialConfidence;

  if (applicableModifiers.length === 0) {
    reasoning.push('No situational adjustments needed');
  }

  if (boundedConfidence !== adjustedConfidence) {
    reasoning.push(
      `Confidence bounded to ${boundedConfidence.toFixed(1)}% (original adjusted: ${adjustedConfidence.toFixed(1)}%)`
    );
  }

  console.log(
    `[Bayesian] ${initialConfidence}% → ${boundedConfidence.toFixed(1)}% (${applicableModifiers.length} modifiers applied)`
  );

  return {
    originalConfidence: initialConfidence,
    adjustedConfidence: parseFloat(boundedConfidence.toFixed(2)),
    modifiersApplied: applicableModifiers,
    totalAdjustment: parseFloat(totalAdjustment.toFixed(2)),
    reasoning,
  };
}

/**
 * Get summary of all active modifiers
 */
export async function getActiveModifiers(sport: string): Promise<ConfidenceModifier[]> {
  return await calculateModifiers(sport);
}

/**
 * Save modifier for future use (caching)
 */
export async function saveModifier(modifier: ConfidenceModifier, sport: string): Promise<void> {
  // TODO: Save to database for quick retrieval
  console.log(`[Bayesian] Saving modifier: ${modifier.situation}`);
}

export default {
  calculateModifiers,
  applyBayesianUpdate,
  getActiveModifiers,
  saveModifier,
};
