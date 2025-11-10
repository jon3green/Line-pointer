import { ParlayLeg } from './types';

export interface ValidationResult {
  valid: boolean;
  error?: string;
  warnings?: string[];
}

/**
 * Comprehensive Parlay Validation System
 * Ensures parlays meet betting rules and maximize success probability
 */

export function validateParlayLegs(legs: ParlayLeg[]): ValidationResult {
  const warnings: string[] = [];

  // 1. Minimum legs check
  if (legs.length < 2) {
    return {
      valid: false,
      error: 'Parlays require at least 2 legs',
    };
  }

  // 2. Maximum legs check (most sportsbooks limit to 10-15)
  if (legs.length > 12) {
    return {
      valid: false,
      error: 'Maximum 12 legs allowed per parlay',
    };
  }

  // 3. Support same-game parlays while preventing duplicate team exposure across different games
  const teamsUsed = new Set<string>();
  const sameGameLegTypes = new Map<string, Set<ParlayLeg['betType']>>();
  const sameGameNotices = new Set<string>();

  for (const leg of legs) {
    const homeId = leg.game.homeTeam.id;
    const awayId = leg.game.awayTeam.id;
    const existingLegTypes = sameGameLegTypes.get(leg.gameId) ?? new Set<ParlayLeg['betType']>();
    const isSameGameAddition = existingLegTypes.size > 0;

    if (!isSameGameAddition) {
      if (teamsUsed.has(homeId) || teamsUsed.has(awayId)) {
        return {
          valid: false,
          error: `Cannot include ${leg.game.homeTeam.name} or ${leg.game.awayTeam.name} in multiple legs across different games.`,
        };
      }
      teamsUsed.add(homeId);
      teamsUsed.add(awayId);
    } else {
      if (existingLegTypes.has(leg.betType)) {
        return {
          valid: false,
          error: `Duplicate ${leg.betType} selections detected for ${leg.game.awayTeam.abbreviation} @ ${leg.game.homeTeam.abbreviation}.`,
        };
      }
      if (existingLegTypes.size >= 3) {
        return {
          valid: false,
          error: 'Line Pointer currently limits same-game parlays to three legs per matchup.',
        };
      }

      const noticeKey = `${leg.gameId}-${existingLegTypes.size}`;
      if (!sameGameNotices.has(noticeKey)) {
        sameGameNotices.add(noticeKey);
        warnings.push(`ℹ️ Same-game parlay detected for ${leg.game.awayTeam.abbreviation} @ ${leg.game.homeTeam.abbreviation}. Monitor correlated risk.`);
      }
    }

    existingLegTypes.add(leg.betType);
    sameGameLegTypes.set(leg.gameId, existingLegTypes);
  }

  // 6. Probability warnings (low chance parlays)
  const totalProbability = legs.reduce((acc, leg) => acc * (leg.probability / 100), 1) * 100;
  
  if (totalProbability < 5) {
    warnings.push('⚠️ Very low probability parlay (<5%). Consider fewer legs.');
  } else if (totalProbability < 15) {
    warnings.push('⚠️ Low probability parlay (<15%). High risk bet.');
  }

  // 7. Check for heavy favorites (low value)
  const heavyFavorites = legs.filter(leg => leg.odds < -300);
  if (heavyFavorites.length > 2) {
    warnings.push('💡 Multiple heavy favorites. Consider value alternatives.');
  }

  // 8. Check for all underdogs (high variance)
  const allUnderdogs = legs.every(leg => leg.odds > 0);
  if (allUnderdogs && legs.length > 3) {
    warnings.push('💡 All underdogs parlay. High variance, but good potential value!');
  }

  // 9. Check for correlated outcomes (same day games from same division)
  const sameDayGames = legs.filter(leg => {
    const gameDate = new Date(leg.game.date);
    const today = new Date();
    return gameDate.toDateString() === today.toDateString();
  });

  if (sameDayGames.length === legs.length && legs.length > 4) {
    warnings.push('💡 All games on same day. Consider spreading across multiple days for variance reduction.');
  }

  // 10. Optimal parlay size recommendation
  if (legs.length > 5) {
    warnings.push('💡 Parlays with 5+ legs have exponentially lower success rates. Consider splitting into multiple smaller parlays.');
  }

  return {
    valid: true,
    warnings: warnings.length > 0 ? warnings : undefined,
  };
}

/**
 * Calculate true odds (remove bookmaker vig/juice)
 */
export function removeVig(americanOdds: number, vigPercentage: number = 4.5): number {
  const impliedProb = calculateImpliedProbability(americanOdds);
  const vigFreeProb = impliedProb / (1 + vigPercentage / 100);
  return probabilityToAmericanOdds(vigFreeProb);
}

/**
 * Calculate implied probability from American odds
 */
function calculateImpliedProbability(odds: number): number {
  if (odds > 0) {
    return 100 / (odds + 100);
  } else {
    return Math.abs(odds) / (Math.abs(odds) + 100);
  }
}

/**
 * Convert probability to American odds
 */
function probabilityToAmericanOdds(probability: number): number {
  if (probability >= 0.5) {
    return Math.round(-100 * (probability / (1 - probability)));
  } else {
    return Math.round(100 * ((1 - probability) / probability));
  }
}

/**
 * Calculate expected value (EV) of a parlay
 */
export function calculateParlayEV(
  legs: ParlayLeg[],
  stake: number,
  totalOdds: number
): number {
  const combinedProbability = legs.reduce((acc, leg) => {
    return acc * (leg.probability / 100);
  }, 1);

  const payout = stake * (totalOdds > 0 ? (totalOdds / 100) + 1 : (100 / Math.abs(totalOdds)) + 1);
  const expectedValue = (combinedProbability * payout) - stake;

  return expectedValue;
}

/**
 * Calculate Kelly Criterion for optimal bet sizing
 */
export function calculateKellyCriterion(
  probability: number,
  odds: number,
  bankroll: number
): number {
  const decimalOdds = odds > 0 ? (odds / 100) + 1 : (100 / Math.abs(odds)) + 1;
  const kelly = (probability * decimalOdds - 1) / (decimalOdds - 1);

  // Use fractional Kelly (25% of full Kelly) for safety
  const fractionalKelly = kelly * 0.25;

  // Cap at 5% of bankroll
  const maxBet = bankroll * 0.05;
  const recommendedBet = Math.min(fractionalKelly * bankroll, maxBet);

  return Math.max(0, recommendedBet);
}

/**
 * Analyze parlay quality and provide recommendations
 */
export function analyzeParlayQuality(legs: ParlayLeg[]): {
  quality: 'excellent' | 'good' | 'fair' | 'poor';
  score: number;
  recommendations: string[];
} {
  let score = 100;
  const recommendations: string[] = [];

  // Factor 1: Number of legs (fewer is generally better)
  if (legs.length > 6) {
    score -= 20;
    recommendations.push('Consider reducing to 4-6 legs for higher success probability');
  } else if (legs.length <= 4) {
    score += 10;
  }

  // Factor 2: Combined probability
  const totalProb = legs.reduce((acc, leg) => acc * (leg.probability / 100), 1) * 100;
  if (totalProb < 10) {
    score -= 30;
    recommendations.push('Very low combined probability. High risk parlay.');
  } else if (totalProb > 30) {
    score += 15;
  }

  // Factor 3: Odds distribution (balanced is better)
  const avgOdds = legs.reduce((acc, leg) => acc + Math.abs(leg.odds), 0) / legs.length;
  const oddsStdDev = Math.sqrt(
    legs.reduce((acc, leg) => acc + Math.pow(Math.abs(leg.odds) - avgOdds, 2), 0) / legs.length
  );

  if (oddsStdDev > 200) {
    score -= 10;
    recommendations.push('Consider more balanced odds distribution');
  }

  // Factor 4: Heavy favorites check
  const heavyFavCount = legs.filter(leg => leg.odds < -250).length;
  if (heavyFavCount > legs.length / 2) {
    score -= 15;
    recommendations.push('Too many heavy favorites. Low value parlay.');
  }

  // Factor 5: Confidence scores
  const avgConfidence = legs.reduce((acc, leg) => acc + leg.probability, 0) / legs.length;
  if (avgConfidence > 70) {
    score += 10;
  } else if (avgConfidence < 55) {
    score -= 15;
    recommendations.push('Low average confidence. Consider higher confidence picks.');
  }

  // Determine quality tier
  let quality: 'excellent' | 'good' | 'fair' | 'poor';
  if (score >= 85) quality = 'excellent';
  else if (score >= 70) quality = 'good';
  else if (score >= 50) quality = 'fair';
  else quality = 'poor';

  return {
    quality,
    score: Math.max(0, Math.min(100, score)),
    recommendations: recommendations.length > 0 ? recommendations : ['Solid parlay structure!'],
  };
}

/**
 * Round Robin combinations generator
 */
export function generateRoundRobin(
  legs: ParlayLeg[],
  parlaySize: number
): ParlayLeg[][] {
  const combinations: ParlayLeg[][] = [];

  function combine(start: number, chosen: ParlayLeg[]) {
    if (chosen.length === parlaySize) {
      combinations.push([...chosen]);
      return;
    }

    for (let i = start; i < legs.length; i++) {
      combine(i + 1, [...chosen, legs[i]]);
    }
  }

  combine(0, []);
  return combinations;
}

