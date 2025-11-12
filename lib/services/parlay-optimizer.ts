/**
 * Parlay Optimizer Service
 * Analyzes correlations, calculates EV, and optimizes parlay selections
 */

export interface ParlayLeg {
  gameId: string;
  predictionId?: string;
  selection: string;
  betType: string;
  odds: number;
  confidence: number;
  line?: number;
  team?: string;
  opponent?: string;
}

export interface CorrelationWarning {
  severity: 'low' | 'medium' | 'high';
  message: string;
  affectedLegs: number[];
}

export interface ParlayOptimization {
  correlationScore: number; // 0-100, lower is better
  expectedValue: number;
  evPercentage: number;
  trueProbability: number;
  impliedProbability: number;
  qualityGrade: 'A' | 'B' | 'C' | 'D' | 'F';
  warnings: CorrelationWarning[];
  recommendation: string;
  parlayOdds: number;
  potentialPayout: number;
}

/**
 * Calculate correlation between two parlay legs
 */
export function calculateCorrelation(leg1: ParlayLeg, leg2: ParlayLeg): number {
  let correlationScore = 0;

  // Same game correlation (highest)
  if (leg1.gameId === leg2.gameId) {
    correlationScore += 60;

    // Same game, same team (very high)
    if (leg1.team === leg2.team) {
      correlationScore += 20;

      // Same game, same team, related bets (extremely high)
      // e.g., Team ML + Team spread, or Over + Team over
      if ((leg1.betType === 'moneyline' && leg2.betType === 'spread') ||
          (leg1.betType === 'spread' && leg2.betType === 'moneyline') ||
          (leg1.betType === 'total' && leg2.betType === 'spread')) {
        correlationScore += 15;
      }
    }

    // Same game, opposite sides (inverse correlation but still correlated)
    if (leg1.team !== leg2.team) {
      correlationScore += 10;
    }
  }

  // Division rivals playing same day (slight correlation)
  // This would require team/division data - simplified here
  if (leg1.gameId !== leg2.gameId) {
    // Check if games are close in time (within 4 hours) - weather/conditions correlation
    // Would need game time data
    correlationScore += 0;
  }

  return Math.min(correlationScore, 100);
}

/**
 * Analyze all correlations in a parlay
 */
export async function analyzeCorrelations(legs: ParlayLeg[]): Promise<{
  overallScore: number;
  warnings: CorrelationWarning[];
  pairwise: Array<{ leg1: number; leg2: number; score: number }>;
}> {
  const pairwise: Array<{ leg1: number; leg2: number; score: number }> = [];
  const warnings: CorrelationWarning[] = [];

  // Check all pairs
  for (let i = 0; i < legs.length; i++) {
    for (let j = i + 1; j < legs.length; j++) {
      const score = calculateCorrelation(legs[i], legs[j]);
      pairwise.push({ leg1: i, leg2: j, score });

      // Generate warnings
      if (score >= 80) {
        warnings.push({
          severity: 'high',
          message: `Legs ${i + 1} and ${j + 1} are highly correlated (same game, same team). True odds are much worse than shown.`,
          affectedLegs: [i, j],
        });
      } else if (score >= 60) {
        warnings.push({
          severity: 'medium',
          message: `Legs ${i + 1} and ${j + 1} are correlated (same game). Consider removing one.`,
          affectedLegs: [i, j],
        });
      } else if (score >= 30) {
        warnings.push({
          severity: 'low',
          message: `Legs ${i + 1} and ${j + 1} have slight correlation.`,
          affectedLegs: [i, j],
        });
      }
    }
  }

  // Calculate overall correlation score (average of all pairs)
  const overallScore = pairwise.length > 0
    ? pairwise.reduce((sum, p) => sum + p.score, 0) / pairwise.length
    : 0;

  return { overallScore, warnings, pairwise };
}

/**
 * Calculate combined parlay odds
 */
export function calculateParlayOdds(legs: ParlayLeg[]): number {
  let decimalOdds = 1;

  for (const leg of legs) {
    const legDecimal = leg.odds > 0
      ? (leg.odds / 100) + 1
      : (100 / Math.abs(leg.odds)) + 1;
    decimalOdds *= legDecimal;
  }

  // Convert back to American odds
  if (decimalOdds >= 2.0) {
    return Math.round((decimalOdds - 1) * 100);
  } else {
    return Math.round(-100 / (decimalOdds - 1));
  }
}

/**
 * Calculate Expected Value
 */
export function calculateExpectedValue(
  legs: ParlayLeg[],
  parlayOdds: number,
  stake: number
): number {
  // True probability (product of all confidences)
  const trueProbability = legs.reduce((prob, leg) => {
    return prob * (leg.confidence / 100);
  }, 1);

  // Potential payout
  const potentialPayout = parlayOdds > 0
    ? stake * (parlayOdds / 100)
    : stake * (100 / Math.abs(parlayOdds));

  // EV = (True Probability × Payout) - ((1 - True Probability) × Stake)
  const ev = (trueProbability * potentialPayout) - ((1 - trueProbability) * stake);

  return ev;
}

/**
 * Grade a parlay quality
 */
export function gradeParlayQuality(
  correlationScore: number,
  evPercentage: number,
  trueProbability: number
): 'A' | 'B' | 'C' | 'D' | 'F' {
  let points = 0;

  // EV component (0-50 points)
  if (evPercentage > 20) points += 50;
  else if (evPercentage > 10) points += 40;
  else if (evPercentage > 5) points += 30;
  else if (evPercentage > 0) points += 20;
  else if (evPercentage > -5) points += 10;
  else points += 0;

  // Correlation component (0-30 points)
  if (correlationScore < 10) points += 30;
  else if (correlationScore < 30) points += 20;
  else if (correlationScore < 50) points += 10;
  else if (correlationScore < 70) points += 5;
  else points += 0;

  // Probability component (0-20 points)
  if (trueProbability > 0.5) points += 20;
  else if (trueProbability > 0.4) points += 15;
  else if (trueProbability > 0.3) points += 10;
  else if (trueProbability > 0.2) points += 5;
  else points += 0;

  // Grade based on total points
  if (points >= 80) return 'A';
  if (points >= 65) return 'B';
  if (points >= 50) return 'C';
  if (points >= 35) return 'D';
  return 'F';
}

/**
 * Optimize a parlay
 */
export async function optimizeParlay(
  legs: ParlayLeg[],
  stake: number = 10
): Promise<ParlayOptimization> {
  // Analyze correlations
  const { overallScore: correlationScore, warnings } = await analyzeCorrelations(legs);

  // Calculate parlay odds
  const parlayOdds = calculateParlayOdds(legs);

  // Calculate true probability
  const trueProbability = legs.reduce((prob, leg) => {
    return prob * (leg.confidence / 100);
  }, 1);

  // Calculate implied probability from odds
  const impliedProbability = parlayOdds > 0
    ? 100 / (parlayOdds + 100)
    : Math.abs(parlayOdds) / (Math.abs(parlayOdds) + 100);

  // Calculate EV
  const expectedValue = calculateExpectedValue(legs, parlayOdds, stake);
  const evPercentage = (expectedValue / stake) * 100;

  // Calculate potential payout
  const potentialPayout = parlayOdds > 0
    ? stake * (parlayOdds / 100)
    : stake * (100 / Math.abs(parlayOdds));

  // Grade the parlay
  const qualityGrade = gradeParlayQuality(correlationScore, evPercentage, trueProbability);

  // Generate recommendation
  let recommendation = '';
  if (correlationScore > 60) {
    recommendation = '⚠️ HIGH CORRELATION - This parlay has correlated legs that significantly reduce true probability. Consider removing correlated picks.';
  } else if (evPercentage < -10) {
    recommendation = '❌ NEGATIVE EV - This parlay has negative expected value. Pass on this bet.';
  } else if (evPercentage > 10 && correlationScore < 30) {
    recommendation = '✅ EXCELLENT PARLAY - Positive EV with low correlation. This is a quality bet.';
  } else if (evPercentage > 5) {
    recommendation = '👍 GOOD PARLAY - Positive EV but watch for correlations.';
  } else if (evPercentage > 0) {
    recommendation = '🤏 SLIGHT EDGE - Minimal positive EV. Consider flat betting instead.';
  } else {
    recommendation = '⚠️ NEGATIVE EV - Expected to lose money long-term. Pass or reduce stake.';
  }

  return {
    correlationScore: Math.round(correlationScore * 10) / 10,
    expectedValue: Math.round(expectedValue * 100) / 100,
    evPercentage: Math.round(evPercentage * 10) / 10,
    trueProbability: Math.round(trueProbability * 1000) / 10,
    impliedProbability: Math.round(impliedProbability * 1000) / 10,
    qualityGrade,
    warnings,
    recommendation,
    parlayOdds,
    potentialPayout: Math.round(potentialPayout * 100) / 100,
  };
}

/**
 * Generate AI-optimized parlay suggestions
 */
export async function generateParlaysuggestions(
  predictions: any[],
  numLegs: number,
  count: number
): Promise<any[]> {
  const suggestions: any[] = [];

  // Generate combinations
  const combinations = generateCombinations(predictions, numLegs);

  // Score each combination
  for (const combo of combinations) {
    const legs: ParlayLeg[] = combo.map(pred => ({
      gameId: pred.gameId,
      predictionId: pred.id,
      selection: pred.prediction,
      betType: pred.betType || 'spread',
      odds: pred.odds || -110,
      confidence: pred.confidence,
      line: pred.line,
      team: pred.homeTeam || pred.awayTeam,
      opponent: pred.opponent,
    }));

    // Optimize
    const optimization = await optimizeParlay(legs, 10);

    // Only include if positive EV and low correlation
    if (optimization.expectedValue > 0 && optimization.correlationScore < 50) {
      suggestions.push({
        legs: combo.map(pred => ({
          gameId: pred.gameId,
          game: `${pred.game.awayTeam} @ ${pred.game.homeTeam}`,
          prediction: pred.prediction,
          confidence: pred.confidence,
          odds: pred.odds || -110,
        })),
        optimization,
      });
    }

    if (suggestions.length >= count * 3) break; // Get extras to sort
  }

  // Sort by EV and take top N
  suggestions.sort((a, b) => b.optimization.expectedValue - a.optimization.expectedValue);

  return suggestions.slice(0, count);
}

/**
 * Generate combinations of N items from array
 */
function generateCombinations(arr: any[], n: number): any[][] {
  const result: any[][] = [];

  function combine(start: number, chosen: any[]) {
    if (chosen.length === n) {
      result.push([...chosen]);
      return;
    }

    for (let i = start; i < arr.length; i++) {
      chosen.push(arr[i]);
      combine(i + 1, chosen);
      chosen.pop();
    }
  }

  combine(0, []);
  return result;
}
