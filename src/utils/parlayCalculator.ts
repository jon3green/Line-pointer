import type { ParlayPick, Parlay } from '../types';

export function calculateCombinedProbability(picks: ParlayPick[]): number {
  if (picks.length === 0) return 0;

  // Convert confidence to probability estimate
  const probabilities = picks.map(pick => {
    switch (pick.confidence) {
      case 'High': return 0.70;
      case 'Medium': return 0.60;
      case 'Low': return 0.50;
      default: return 0.50;
    }
  });

  // Calculate combined probability (multiply all probabilities)
  const combined = probabilities.reduce((acc, prob) => acc * prob, 1);
  return Math.round(combined * 100);
}

export function calculateRiskLevel(picks: ParlayPick[]): 'Conservative' | 'Moderate' | 'Aggressive' {
  if (picks.length <= 3) {
    const highConfidenceCount = picks.filter(p => p.confidence === 'High').length;
    if (highConfidenceCount === picks.length) return 'Conservative';
    if (highConfidenceCount >= picks.length / 2) return 'Moderate';
    return 'Aggressive';
  } else if (picks.length <= 6) {
    const highConfidenceCount = picks.filter(p => p.confidence === 'High').length;
    if (highConfidenceCount >= picks.length * 0.7) return 'Moderate';
    return 'Aggressive';
  } else {
    return 'Aggressive';
  }
}

export function buildParlay(picks: ParlayPick[]): Parlay {
  const combinedProbability = calculateCombinedProbability(picks);
  const riskLevel = calculateRiskLevel(picks);

  return {
    id: `parlay-${Date.now()}`,
    picks,
    combinedProbability,
    riskLevel
  };
}

export function calculatePotentialPayout(stake: number, americanOdds: number[]): number {
  // Convert American odds to decimal odds and multiply
  let totalOdds = 1;

  americanOdds.forEach(odds => {
    const decimalOdds = odds > 0 ? (odds / 100) + 1 : (100 / Math.abs(odds)) + 1;
    totalOdds *= decimalOdds;
  });

  return Math.round(stake * totalOdds * 100) / 100;
}
