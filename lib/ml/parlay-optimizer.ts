/**
 * Automated Parlay Generator
 * Creates optimal 3-5 bet parlays with best possible odds
 */

import type { Game, ParlayLeg } from '../types';

interface OptimalParlay {
  id: string;
  legs: ParlayLeg[];
  totalOdds: number;
  combinedProbability: number;
  expectedValue: number;
  potentialPayout: number;
  confidence: 'high' | 'medium' | 'low';
  strategy: string;
  reasoning: string[];
}

interface ParlayOption {
  game: Game;
  betType: 'spread' | 'moneyline' | 'total';
  selection: string;
  odds: number;
  probability: number;
  confidence: number;
}

/**
 * Generate optimal parlays from available games
 */
export function generateOptimalParlays(
  games: Game[],
  stake: number = 100,
  minLegs: number = 3,
  maxLegs: number = 5
): OptimalParlay[] {
  // Get all betting options
  const allOptions = extractBettingOptions(games);

  // Filter to high-value options
  const valueBets = allOptions.filter((opt) => opt.confidence >= 55);

  if (valueBets.length < minLegs) {
    return [];
  }

  const parlays: OptimalParlay[] = [];

  // Strategy 1: Maximum Confidence (safest)
  const highConfidenceBets = valueBets
    .filter((opt) => opt.confidence >= 70)
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, maxLegs);

  if (highConfidenceBets.length >= minLegs) {
    for (let legCount = minLegs; legCount <= Math.min(maxLegs, highConfidenceBets.length); legCount++) {
      const legs = highConfidenceBets.slice(0, legCount);
      const parlay = buildParlay(legs, stake, 'Maximum Confidence', [
        'Selects highest confidence picks',
        'Prioritizes win probability over payout',
        'Best for consistent returns',
      ]);
      parlays.push(parlay);
    }
  }

  // Strategy 2: Balanced Value (best EV)
  const balancedBets = valueBets
    .map((opt) => ({
      ...opt,
      ev: calculateExpectedValue(opt.probability, opt.odds),
    }))
    .sort((a, b) => b.ev - a.ev)
    .slice(0, maxLegs);

  if (balancedBets.length >= minLegs) {
    for (let legCount = minLegs; legCount <= Math.min(maxLegs, balancedBets.length); legCount++) {
      const legs = balancedBets.slice(0, legCount);
      const parlay = buildParlay(legs, stake, 'Balanced Value', [
        'Optimizes expected value (EV)',
        'Balances probability and payout',
        'Best risk-reward ratio',
      ]);
      parlays.push(parlay);
    }
  }

  // Strategy 3: Underdog Hunter (highest payout)
  const underdogBets = valueBets
    .filter((opt) => opt.odds > 100 && opt.confidence >= 55)
    .sort((a, b) => b.odds - a.odds)
    .slice(0, maxLegs);

  if (underdogBets.length >= minLegs) {
    for (let legCount = minLegs; legCount <= Math.min(maxLegs, underdogBets.length); legCount++) {
      const legs = underdogBets.slice(0, legCount);
      const parlay = buildParlay(legs, stake, 'Underdog Hunter', [
        'Targets higher-paying underdogs',
        'Higher risk, higher reward',
        'Best for lottery-style plays',
      ]);
      parlays.push(parlay);
    }
  }

  // Strategy 4: Spread Special (spread bets only)
  const spreadBets = valueBets
    .filter((opt) => opt.betType === 'spread' && opt.confidence >= 60)
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, maxLegs);

  if (spreadBets.length >= minLegs) {
    for (let legCount = minLegs; legCount <= Math.min(maxLegs, spreadBets.length); legCount++) {
      const legs = spreadBets.slice(0, legCount);
      const parlay = buildParlay(legs, stake, 'Spread Special', [
        'Focuses on spread bets only',
        'Leverages line movement analysis',
        'Best for spread bettors',
      ]);
      parlays.push(parlay);
    }
  }

  // Strategy 5: Totals Master (over/under only)
  const totalBets = valueBets
    .filter((opt) => opt.betType === 'total' && opt.confidence >= 60)
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, maxLegs);

  if (totalBets.length >= minLegs) {
    for (let legCount = minLegs; legCount <= Math.min(maxLegs, totalBets.length); legCount++) {
      const legs = totalBets.slice(0, legCount);
      const parlay = buildParlay(legs, stake, 'Totals Master', [
        'Over/Under bets only',
        'Focuses on scoring trends',
        'Best for totals specialists',
      ]);
      parlays.push(parlay);
    }
  }

  // Strategy 6: Moneyline Madness (ML only)
  const mlBets = valueBets
    .filter((opt) => opt.betType === 'moneyline' && opt.confidence >= 65)
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, maxLegs);

  if (mlBets.length >= minLegs) {
    for (let legCount = minLegs; legCount <= Math.min(maxLegs, mlBets.length); legCount++) {
      const legs = mlBets.slice(0, legCount);
      const parlay = buildParlay(legs, stake, 'Moneyline Madness', [
        'Straight winners only',
        'No spread complications',
        'Best for picking winners',
      ]);
      parlays.push(parlay);
    }
  }

  // Sort by expected value and deduplicate
  return parlays
    .sort((a, b) => b.expectedValue - a.expectedValue)
    .filter((parlay, index, self) =>
      index === self.findIndex((p) =>
        p.legs.length === parlay.legs.length &&
        p.strategy === parlay.strategy
      )
    )
    .slice(0, 20); // Return top 20 parlays
}

/**
 * Extract all betting options from games
 */
function extractBettingOptions(games: Game[]): ParlayOption[] {
  const options: ParlayOption[] = [];

  games.forEach((game) => {
    if (!game.prediction || !game.odds) return;

    const confidence = game.prediction.confidence;
    const winner = game.prediction.winner;

    // Spread bets
    if (game.odds.spread) {
      const homeSpread = game.odds.spread.home;
      const homeSpreadOdds = game.odds.spread.homeOdds || -110;
      const awaySpreadOdds = game.odds.spread.awayOdds || -110;

      if (winner === 'home') {
        options.push({
          game,
          betType: 'spread',
          selection: `${game.homeTeam.abbreviation} ${homeSpread > 0 ? '+' : ''}${homeSpread}`,
          odds: homeSpreadOdds,
          probability: confidence / 100,
          confidence,
        });
      } else {
        options.push({
          game,
          betType: 'spread',
          selection: `${game.awayTeam.abbreviation} ${-homeSpread > 0 ? '+' : ''}${-homeSpread}`,
          odds: awaySpreadOdds,
          probability: confidence / 100,
          confidence,
        });
      }
    }

    // Moneyline bets
    if (game.odds.moneyline) {
      const homeML = game.odds.moneyline.home;
      const awayML = game.odds.moneyline.away;

      if (winner === 'home') {
        options.push({
          game,
          betType: 'moneyline',
          selection: `${game.homeTeam.abbreviation} ML`,
          odds: homeML,
          probability: confidence / 100,
          confidence,
        });
      } else {
        options.push({
          game,
          betType: 'moneyline',
          selection: `${game.awayTeam.abbreviation} ML`,
          odds: awayML,
          probability: confidence / 100,
          confidence,
        });
      }
    }

    // Total bets
    if (game.odds.total && game.prediction.predictedScore) {
      const line = game.odds.total.line;
      const predictedTotal = game.prediction.predictedScore.home + game.prediction.predictedScore.away;
      const overOdds = game.odds.total.over || -110;
      const underOdds = game.odds.total.under || -110;

      // Determine if we predict over or under
      const diff = Math.abs(predictedTotal - line);
      const totalConfidence = Math.min(confidence, 50 + diff * 2); // Adjust confidence based on margin

      if (predictedTotal > line + 2) {
        options.push({
          game,
          betType: 'total',
          selection: `Over ${line}`,
          odds: overOdds,
          probability: totalConfidence / 100,
          confidence: totalConfidence,
        });
      } else if (predictedTotal < line - 2) {
        options.push({
          game,
          betType: 'total',
          selection: `Under ${line}`,
          odds: underOdds,
          probability: totalConfidence / 100,
          confidence: totalConfidence,
        });
      }
    }
  });

  return options;
}

/**
 * Build a parlay from selected options
 */
function buildParlay(
  options: ParlayOption[],
  stake: number,
  strategy: string,
  reasoning: string[]
): OptimalParlay {
  const legs: ParlayLeg[] = options.map((opt) => ({
    gameId: opt.game.id,
    game: opt.game,
    betType: opt.betType,
    selection: opt.selection,
    odds: opt.odds,
    probability: opt.probability,
  }));

  const totalOdds = calculateParlayOdds(options.map((o) => o.odds));
  const combinedProbability = options.reduce((prob, opt) => prob * opt.probability, 1);
  const potentialPayout = calculatePayout(stake, totalOdds);
  const expectedValue = (combinedProbability * potentialPayout) - stake;

  const avgConfidence = options.reduce((sum, opt) => sum + opt.confidence, 0) / options.length;
  const confidence: 'high' | 'medium' | 'low' =
    avgConfidence >= 70 ? 'high' : avgConfidence >= 60 ? 'medium' : 'low';

  return {
    id: generateParlayId(legs),
    legs,
    totalOdds,
    combinedProbability: Number((combinedProbability * 100).toFixed(2)),
    expectedValue: Number(expectedValue.toFixed(2)),
    potentialPayout: Number(potentialPayout.toFixed(2)),
    confidence,
    strategy,
    reasoning,
  };
}

/**
 * Calculate parlay odds from individual odds
 */
function calculateParlayOdds(odds: number[]): number {
  let totalDecimal = 1;

  odds.forEach((odd) => {
    const decimal = americanToDecimal(odd);
    totalDecimal *= decimal;
  });

  return decimalToAmerican(totalDecimal);
}

/**
 * Convert American odds to decimal
 */
function americanToDecimal(american: number): number {
  if (american > 0) {
    return (american / 100) + 1;
  } else {
    return (100 / Math.abs(american)) + 1;
  }
}

/**
 * Convert decimal odds to American
 */
function decimalToAmerican(decimal: number): number {
  if (decimal >= 2) {
    return Math.round((decimal - 1) * 100);
  } else {
    return Math.round(-100 / (decimal - 1));
  }
}

/**
 * Calculate potential payout
 */
function calculatePayout(stake: number, odds: number): number {
  if (odds > 0) {
    return stake + (stake * odds / 100);
  } else {
    return stake + (stake * 100 / Math.abs(odds));
  }
}

/**
 * Calculate expected value
 */
function calculateExpectedValue(probability: number, odds: number): number {
  const decimal = americanToDecimal(odds);
  return (probability * decimal) - 1;
}

/**
 * Generate unique parlay ID
 */
function generateParlayId(legs: ParlayLeg[]): string {
  const ids = legs.map((l) => l.gameId).sort().join('-');
  return `parlay-${ids.substring(0, 20)}`;
}

/**
 * Get recommended stake for a parlay based on confidence
 */
export function getRecommendedStake(
  parlay: OptimalParlay,
  bankroll: number,
  riskTolerance: 'conservative' | 'moderate' | 'aggressive' = 'moderate'
): number {
  const kellyFraction = parlay.combinedProbability / 100;
  const odds = parlay.totalOdds;
  const b = odds > 0 ? odds / 100 : 100 / Math.abs(odds);

  // Kelly Criterion: f = (bp - q) / b
  // where b = odds, p = probability, q = 1-p
  const p = kellyFraction;
  const q = 1 - p;
  const kellyPercent = ((b * p) - q) / b;

  // Adjust based on risk tolerance
  const fractionMap = {
    conservative: 0.25, // Quarter Kelly
    moderate: 0.5,      // Half Kelly
    aggressive: 1.0,    // Full Kelly
  };

  const adjustedKelly = Math.max(0, kellyPercent * fractionMap[riskTolerance]);

  // Never bet more than 10% of bankroll on a single parlay
  const maxBet = bankroll * 0.1;
  const recommendedStake = Math.min(bankroll * adjustedKelly, maxBet);

  // Round to nearest $5
  return Math.max(5, Math.round(recommendedStake / 5) * 5);
}
