/**
 * Correlation Analysis Service
 * Warn about correlated parlays that reduce true odds
 *
 * KEY CONCEPT:
 * - Parlays assume independence: 50% × 50% = 25%
 * - But correlations exist: Chiefs -7 + Chiefs/Bills UNDER are related
 * - True combined probability is NOT the product
 *
 * EXAMPLES:
 * - Same game spread + total = HIGHLY CORRELATED
 * - Same team in multiple bets = CORRELATED
 * - Overs in same time slot = SLIGHTLY CORRELATED (weather)
 */

export type CorrelationAnalysis = {
  bet1: ParlayLeg;
  bet2: ParlayLeg;

  correlationCoefficient: number; // -1 to +1 (0 = independent)
  correlationType: 'positive' | 'negative' | 'neutral';

  // Impact on parlay value
  expectedOddsReduction: number; // Percentage (20% = odds are 20% worse)
  trueOdds: number; // Actual combined probability
  bookOdds: number; // What book pays (assumes independence)

  warning: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'none';
  recommendation: string;
};

export type ParlayLeg = {
  gameId: string;
  matchup: string;
  betType: 'spread' | 'total' | 'moneyline' | 'team_total' | 'prop';
  selection: string; // e.g., "Chiefs -7", "OVER 50", "Mahomes OVER 2.5 TDs"
  team?: string; // If applicable
  probability: number; // 0-1
};

export type ParlayCorrelationReport = {
  legs: ParlayLeg[];

  // Overall analysis
  totalCorrelations: number;
  highCorrelations: number; // Coefficient > 0.5

  // Value analysis
  assumedProbability: number; // If independent
  adjustedProbability: number; // Accounting for correlations
  valueReduction: number; // Percentage loss

  // Warnings
  correlations: CorrelationAnalysis[];
  overallWarning: string;
  severity: 'safe' | 'caution' | 'risky' | 'bad';

  // Recommendations
  suggestedRemovals: string[]; // Legs to remove
  alternativeCombos: Array<{
    legs: string[];
    adjustedProbability: number;
    reasoning: string;
  }>;
};

class CorrelationService {
  // Correlation coefficient reference data
  private readonly CORRELATION_MATRIX: Record<string, number> = {
    // Same game correlations
    'same_game_spread_total': 0.65, // Strong correlation
    'same_game_spread_team_total': 0.75, // Very strong
    'same_game_ml_spread': 0.95, // Nearly identical

    // Same team correlations
    'same_team_different_games_spread': 0.25, // Moderate
    'same_team_future_spread': 0.40, // If games close in time

    // Time-based correlations
    'same_timeslot_overs': 0.15, // Weather, officiating
    'same_timeslot_unders': 0.12,

    // Player props correlations
    'same_player_multiple_props': 0.60, // Points + assists correlated
    'same_team_player_props': 0.35,

    // Negative correlations
    'favorite_spread_under': -0.30, // Favorites more likely to hit over
    'dog_spread_under': 0.25 // Dogs more likely to go under
  };

  /**
   * Analyze correlation between two parlay legs
   */
  analyzeCorrelation(leg1: ParlayLeg, leg2: ParlayLeg): CorrelationAnalysis {
    // Determine correlation type
    const correlationType = this.determineCorrelationType(leg1, leg2);
    const correlationCoefficient = this.getCorrelationCoefficient(leg1, leg2, correlationType);

    // Calculate impact on odds
    const { trueOdds, expectedReduction } = this.calculateTrueOdds(
      leg1.probability,
      leg2.probability,
      correlationCoefficient
    );

    const bookOdds = leg1.probability * leg2.probability; // Book assumes independence

    // Generate warning
    const { warning, severity, recommendation } = this.generateWarning(
      leg1,
      leg2,
      correlationCoefficient,
      expectedReduction
    );

    // Determine correlation type
    let type: 'positive' | 'negative' | 'neutral' = 'neutral';
    if (correlationCoefficient > 0.2) type = 'positive';
    else if (correlationCoefficient < -0.2) type = 'negative';

    return {
      bet1: leg1,
      bet2: leg2,
      correlationCoefficient,
      correlationType: type,
      expectedOddsReduction: expectedReduction,
      trueOdds,
      bookOdds,
      warning,
      severity,
      recommendation
    };
  }

  /**
   * Analyze full parlay for correlations
   */
  analyzeParlayCorrelations(legs: ParlayLeg[]): ParlayCorrelationReport {
    if (legs.length < 2) {
      return {
        legs,
        totalCorrelations: 0,
        highCorrelations: 0,
        assumedProbability: legs[0]?.probability || 0,
        adjustedProbability: legs[0]?.probability || 0,
        valueReduction: 0,
        correlations: [],
        overallWarning: 'Single bet - no correlations',
        severity: 'safe',
        suggestedRemovals: [],
        alternativeCombos: []
      };
    }

    // Check all pairs for correlations
    const correlations: CorrelationAnalysis[] = [];
    for (let i = 0; i < legs.length; i++) {
      for (let j = i + 1; j < legs.length; j++) {
        const correlation = this.analyzeCorrelation(legs[i], legs[j]);
        if (Math.abs(correlation.correlationCoefficient) > 0.1) {
          correlations.push(correlation);
        }
      }
    }

    const highCorrelations = correlations.filter(c => Math.abs(c.correlationCoefficient) > 0.5).length;

    // Calculate parlay probabilities
    const assumedProbability = legs.reduce((prob, leg) => prob * leg.probability, 1);
    const adjustedProbability = this.calculateAdjustedParlayProbability(legs, correlations);
    const valueReduction = ((assumedProbability - adjustedProbability) / assumedProbability) * 100;

    // Overall assessment
    const { overallWarning, severity } = this.assessOverallRisk(correlations, valueReduction);

    // Generate suggestions
    const suggestedRemovals = this.suggestRemovals(legs, correlations);
    const alternativeCombos = this.suggestAlternatives(legs, correlations);

    return {
      legs,
      totalCorrelations: correlations.length,
      highCorrelations,
      assumedProbability,
      adjustedProbability,
      valueReduction,
      correlations,
      overallWarning,
      severity,
      suggestedRemovals,
      alternativeCombos
    };
  }

  /**
   * Check specific common bad parlays
   */
  checkBadParlayCombo(leg1: ParlayLeg, leg2: ParlayLeg): {
    isBad: boolean;
    reason: string;
  } {
    // Same game spread + total
    if (leg1.gameId === leg2.gameId && leg1.betType === 'spread' && leg2.betType === 'total') {
      return {
        isBad: true,
        reason: 'Same game spread + total are highly correlated. If Chiefs cover -7, more likely to go OVER.'
      };
    }

    // Same game moneyline + spread
    if (leg1.gameId === leg2.gameId && leg1.betType === 'moneyline' && leg2.betType === 'spread') {
      return {
        isBad: true,
        reason: 'Moneyline and spread on same team are 95% correlated - essentially same bet.'
      };
    }

    // Same player multiple props
    if (leg1.betType === 'prop' && leg2.betType === 'prop' &&
        leg1.selection.split(' ')[0] === leg2.selection.split(' ')[0]) {
      return {
        isBad: true,
        reason: 'Same player props are correlated. Points and assists often move together.'
      };
    }

    // Team total + game total
    if (leg1.gameId === leg2.gameId && (leg1.betType === 'team_total' || leg2.betType === 'team_total') &&
        (leg1.betType === 'total' || leg2.betType === 'total')) {
      return {
        isBad: true,
        reason: 'Team total + game total overlap. Chiefs team total OVER makes game OVER more likely.'
      };
    }

    return { isBad: false, reason: '' };
  }

  // Private helper methods

  private determineCorrelationType(leg1: ParlayLeg, leg2: ParlayLeg): string {
    // Same game?
    if (leg1.gameId === leg2.gameId) {
      if (leg1.betType === 'spread' && leg2.betType === 'total') return 'same_game_spread_total';
      if (leg1.betType === 'spread' && leg2.betType === 'team_total') return 'same_game_spread_team_total';
      if (leg1.betType === 'moneyline' && leg2.betType === 'spread') return 'same_game_ml_spread';
    }

    // Same team different games?
    if (leg1.team && leg2.team && leg1.team === leg2.team && leg1.gameId !== leg2.gameId) {
      return 'same_team_different_games_spread';
    }

    // Player props?
    if (leg1.betType === 'prop' && leg2.betType === 'prop') {
      const player1 = leg1.selection.split(' ')[0];
      const player2 = leg2.selection.split(' ')[0];
      if (player1 === player2) return 'same_player_multiple_props';
      if (leg1.team === leg2.team) return 'same_team_player_props';
    }

    return 'independent';
  }

  private getCorrelationCoefficient(_leg1: ParlayLeg, _leg2: ParlayLeg, type: string): number {
    return this.CORRELATION_MATRIX[type] || 0;
  }

  private calculateTrueOdds(
    prob1: number,
    prob2: number,
    correlation: number
  ): { trueOdds: number; expectedReduction: number } {
    // If independent: prob1 * prob2
    const independentOdds = prob1 * prob2;

    // Adjust for correlation
    // Positive correlation reduces combined probability
    // Formula: P(A and B) ≈ P(A) * P(B) * (1 + correlation * sqrt(P(A) * P(B)))
    const correlationAdjustment = 1 + (correlation * Math.sqrt(prob1 * prob2));
    const trueOdds = independentOdds * correlationAdjustment;

    const expectedReduction = ((independentOdds - trueOdds) / independentOdds) * 100;

    return {
      trueOdds: Math.max(0, Math.min(1, trueOdds)),
      expectedReduction: Math.max(0, expectedReduction)
    };
  }

  private generateWarning(
    _leg1: ParlayLeg,
    _leg2: ParlayLeg,
    correlation: number,
    reduction: number
  ): { warning: string; severity: CorrelationAnalysis['severity']; recommendation: string } {
    if (Math.abs(correlation) < 0.2) {
      return {
        warning: 'Low correlation - legs are mostly independent',
        severity: 'none',
        recommendation: 'Safe to parlay together'
      };
    }

    if (Math.abs(correlation) >= 0.7) {
      return {
        warning: `CRITICAL: Very high correlation (${(correlation * 100).toFixed(0)}%). True odds ${reduction.toFixed(0)}% worse than book pays!`,
        severity: 'critical',
        recommendation: 'DO NOT parlay together - essentially betting on same outcome'
      };
    }

    if (Math.abs(correlation) >= 0.5) {
      return {
        warning: `HIGH: Strong correlation (${(correlation * 100).toFixed(0)}%). Reducing value by ${reduction.toFixed(0)}%`,
        severity: 'high',
        recommendation: 'Avoid parlaying - bet separately for better value'
      };
    }

    if (Math.abs(correlation) >= 0.3) {
      return {
        warning: `MODERATE: Moderate correlation (${(correlation * 100).toFixed(0)}%). Some value reduction`,
        severity: 'medium',
        recommendation: 'Consider removing one leg for better odds'
      };
    }

    return {
      warning: `Low-moderate correlation (${(correlation * 100).toFixed(0)}%)`,
      severity: 'low',
      recommendation: 'Acceptable to parlay but be aware of slight correlation'
    };
  }

  private calculateAdjustedParlayProbability(legs: ParlayLeg[], correlations: CorrelationAnalysis[]): number {
    // Start with independent probability
    let adjustedProb = legs.reduce((prob, leg) => prob * leg.probability, 1);

    // Apply correlation adjustments
    correlations.forEach(corr => {
      if (corr.correlationType === 'positive') {
        adjustedProb *= (1 + Math.abs(corr.correlationCoefficient) * 0.5);
      } else if (corr.correlationType === 'negative') {
        adjustedProb *= (1 - Math.abs(corr.correlationCoefficient) * 0.3);
      }
    });

    return Math.max(0, Math.min(1, adjustedProb));
  }

  private assessOverallRisk(
    correlations: CorrelationAnalysis[],
    valueReduction: number
  ): { overallWarning: string; severity: ParlayCorrelationReport['severity'] } {
    const criticalCount = correlations.filter(c => c.severity === 'critical').length;
    const highCount = correlations.filter(c => c.severity === 'high').length;

    if (criticalCount > 0) {
      return {
        overallWarning: `DANGER: ${criticalCount} critical correlations found. This parlay has terrible value.`,
        severity: 'bad'
      };
    }

    if (highCount > 0 || valueReduction > 20) {
      return {
        overallWarning: `RISKY: ${highCount} strong correlations. Value reduced by ${valueReduction.toFixed(0)}%.`,
        severity: 'risky'
      };
    }

    if (valueReduction > 10) {
      return {
        overallWarning: `CAUTION: Moderate correlations present. Value reduced by ${valueReduction.toFixed(0)}%.`,
        severity: 'caution'
      };
    }

    return {
      overallWarning: 'Low correlations - parlay value is reasonable',
      severity: 'safe'
    };
  }

  private suggestRemovals(_legs: ParlayLeg[], correlations: CorrelationAnalysis[]): string[] {
    // Find legs involved in most high correlations
    const legCorrelationCount: Map<string, number> = new Map();

    correlations.forEach(corr => {
      if (corr.severity === 'critical' || corr.severity === 'high') {
        const leg1Key = corr.bet1.selection;
        const leg2Key = corr.bet2.selection;
        legCorrelationCount.set(leg1Key, (legCorrelationCount.get(leg1Key) || 0) + 1);
        legCorrelationCount.set(leg2Key, (legCorrelationCount.get(leg2Key) || 0) + 1);
      }
    });

    // Sort by count
    const sorted = Array.from(legCorrelationCount.entries())
      .sort((a, b) => b[1] - a[1]);

    return sorted.slice(0, 2).map(([leg]) => leg);
  }

  private suggestAlternatives(legs: ParlayLeg[], correlations: CorrelationAnalysis[]): ParlayCorrelationReport['alternativeCombos'] {
    // Suggest removing most correlated legs
    const suggestions: ParlayCorrelationReport['alternativeCombos'] = [];

    if (correlations.length === 0) return suggestions;

    // Option 1: Remove legs with highest correlations
    const removals = this.suggestRemovals(legs, correlations);
    if (removals.length > 0) {
      suggestions.push({
        legs: legs.filter(l => !removals.includes(l.selection)).map(l => l.selection),
        adjustedProbability: 0.35, // Placeholder
        reasoning: 'Remove highest correlated legs for better value'
      });
    }

    // Option 2: Split into separate bets
    suggestions.push({
      legs: [legs[0].selection],
      adjustedProbability: legs[0].probability,
      reasoning: 'Bet separately for true odds - better long-term value'
    });

    return suggestions;
  }
};

export const correlationService = new CorrelationService();
