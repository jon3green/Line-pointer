/**
 * Professional Edge Score Service
 * Calculates overall betting edge using multiple factors
 */

export type EdgeScore = {
  gameId: string;
  overall: number; // 0-100
  recommendation: 'STRONG_BET' | 'LEAN' | 'PASS' | 'AVOID';
  suggestedStake: number; // Percentage of bankroll (Kelly Criterion)
  confidence: number; // 0-1

  factors: {
    clvExpectation: EdgeFactor;
    sharpConsensus: EdgeFactor;
    modelEdge: EdgeFactor;
    situationalEdge: EdgeFactor;
    lineMovement: EdgeFactor;
    marketInefficiency: EdgeFactor;
  };

  warnings: string[];
  insights: string[];
};

export type EdgeFactor = {
  score: number; // 0-100
  weight: number; // Contribution to overall score
  details: string;
  data?: any;
};

export type SharpBookComparison = {
  gameId: string;
  books: {
    [bookName: string]: {
      spread: number;
      spreadOdds: number;
      total: number;
      totalOdds: number;
      moneylineHome: number;
      moneylineAway: number;
      isSharpBook: boolean;
    };
  };
  bestLines: {
    spread: { book: string; line: number; odds: number };
    total: { book: string; line: number; odds: number };
    moneylineHome: { book: string; odds: number };
    moneylineAway: { book: string; odds: number };
  };
  discrepancies: {
    type: 'spread' | 'total' | 'moneyline';
    description: string;
    edge: number; // Expected value
  }[];
};

export type StatisticalModel = {
  gameId: string;
  prediction: {
    homeScore: number;
    awayScore: number;
    margin: number;
    total: number;
    confidence: number;
  };
  factors: {
    offensiveEfficiency: { home: number; away: number };
    defensiveEfficiency: { home: number; away: number };
    recentForm: { home: number; away: number };
    restDays: { home: number; away: number };
    travelDistance: { home: number; away: number };
    homeCourtAdvantage: number;
    divisionalGame: boolean;
    backToBack: { home: boolean; away: boolean };
  };
  modelEdge: {
    spreadEdge: number; // Our prediction vs current line
    totalEdge: number;
    moneylineEdge: number;
  };
};

export type InjuryImpact = {
  gameId: string;
  injuries: {
    team: 'home' | 'away';
    player: string;
    position: string;
    impact: number; // Points impact on spread
    confidence: number;
    historicalWithout: {
      record: string;
      avgMargin: number;
      sampleSize: number;
    };
  }[];
  totalImpact: {
    home: number;
    away: number;
    netSpreadImpact: number; // Positive favors home
  };
};

export type RiskManagement = {
  bankroll: number;
  exposure: {
    current: number; // Total at risk
    percentage: number;
    remaining: number;
  };
  kellyStake: {
    full: number; // Full Kelly (aggressive)
    fractional: number; // 0.25 Kelly (recommended)
    conservative: number; // 0.1 Kelly (very safe)
  };
  alerts: {
    overexposed: boolean;
    correlatedBets: boolean;
    stopLossHit: boolean;
  };
};

class EdgeService {
  // private readonly EDGE_CACHE_KEY = 'edge_scores';

  /**
   * Calculate comprehensive edge score
   */
  calculateEdgeScore(
    gameId: string,
    currentLine: number,
    openingLine: number,
    projectedClosing: number,
    sharpConsensus: number, // 0-100 (% of sharps on home)
    publicConsensus: number, // 0-100 (% of public on home)
    modelPrediction: number, // Our predicted line
    situationalFactors: any
  ): EdgeScore {
    // 1. CLV Expectation (Weight: 25%)
    const clvExpectation = this.calculateCLVFactor(currentLine, projectedClosing);

    // 2. Sharp Consensus (Weight: 20%)
    const sharpConsensusFactor = this.calculateSharpFactor(sharpConsensus, publicConsensus);

    // 3. Model Edge (Weight: 20%)
    const modelEdgeFactor = this.calculateModelFactor(currentLine, modelPrediction);

    // 4. Situational Edge (Weight: 15%)
    const situationalEdgeFactor = this.calculateSituationalFactor(situationalFactors);

    // 5. Line Movement (Weight: 10%)
    const lineMovementFactor = this.calculateLineMovementFactor(openingLine, currentLine, sharpConsensus, publicConsensus);

    // 6. Market Inefficiency (Weight: 10%)
    const marketInefficiencyFactor = this.calculateMarketInefficiency(currentLine, modelPrediction, sharpConsensus);

    // Calculate overall score
    const overall =
      (clvExpectation.score * 0.25) +
      (sharpConsensusFactor.score * 0.20) +
      (modelEdgeFactor.score * 0.20) +
      (situationalEdgeFactor.score * 0.15) +
      (lineMovementFactor.score * 0.10) +
      (marketInefficiencyFactor.score * 0.10);

    // Determine recommendation
    let recommendation: EdgeScore['recommendation'] = 'PASS';
    if (overall >= 75) recommendation = 'STRONG_BET';
    else if (overall >= 60) recommendation = 'LEAN';
    else if (overall < 40) recommendation = 'AVOID';

    // Calculate confidence
    const confidence = this.calculateConfidence([
      clvExpectation.score,
      sharpConsensusFactor.score,
      modelEdgeFactor.score
    ]);

    // Suggested stake using Kelly Criterion
    const edge = (overall - 50) / 100; // Convert 0-100 to edge %
    const suggestedStake = this.calculateKellyStake(edge, confidence);

    // Warnings and insights
    const warnings = this.generateWarnings(overall, sharpConsensus, publicConsensus, situationalFactors);
    const insights = this.generateInsights(overall, clvExpectation, sharpConsensusFactor, modelEdgeFactor);

    return {
      gameId,
      overall,
      recommendation,
      suggestedStake,
      confidence,
      factors: {
        clvExpectation,
        sharpConsensus: sharpConsensusFactor,
        modelEdge: modelEdgeFactor,
        situationalEdge: situationalEdgeFactor,
        lineMovement: lineMovementFactor,
        marketInefficiency: marketInefficiencyFactor
      },
      warnings,
      insights
    };
  }

  /**
   * Compare lines across sharp books
   */
  compareSharpBooks(gameId: string): SharpBookComparison {
    // Mock data - in production, fetch from multiple bookmaker APIs
    const books: SharpBookComparison['books'] = {
      'Pinnacle': {
        spread: -3.0,
        spreadOdds: -105,
        total: 48.5,
        totalOdds: -110,
        moneylineHome: -155,
        moneylineAway: 135,
        isSharpBook: true
      },
      'Circa': {
        spread: -3.5,
        spreadOdds: -110,
        total: 48.0,
        totalOdds: -110,
        moneylineHome: -165,
        moneylineAway: 145,
        isSharpBook: true
      },
      'DraftKings': {
        spread: -2.5,
        spreadOdds: -115,
        total: 49.0,
        totalOdds: -110,
        moneylineHome: -145,
        moneylineAway: 125,
        isSharpBook: false
      },
      'FanDuel': {
        spread: -2.5,
        spreadOdds: -110,
        total: 49.5,
        totalOdds: -112,
        moneylineHome: -150,
        moneylineAway: 130,
        isSharpBook: false
      },
      'BetMGM': {
        spread: -3.0,
        spreadOdds: -110,
        total: 48.5,
        totalOdds: -115,
        moneylineHome: -160,
        moneylineAway: 140,
        isSharpBook: false
      }
    };

    // Find best lines
    const bestSpread = this.findBestSpread(books);
    const bestTotal = this.findBestTotal(books);
    const bestMLHome = this.findBestMoneyline(books, 'home');
    const bestMLAway = this.findBestMoneyline(books, 'away');

    // Identify discrepancies (2+ point differences = potential edge)
    const discrepancies = this.findDiscrepancies(books);

    return {
      gameId,
      books,
      bestLines: {
        spread: bestSpread,
        total: bestTotal,
        moneylineHome: bestMLHome,
        moneylineAway: bestMLAway
      },
      discrepancies
    };
  }

  /**
   * Generate statistical model prediction
   */
  generateStatisticalModel(gameId: string, _homeTeam: string, _awayTeam: string): StatisticalModel {
    // Mock advanced stats - in production, fetch real team stats
    const factors = {
      offensiveEfficiency: {
        home: 112.5, // Points per 100 possessions
        away: 108.3
      },
      defensiveEfficiency: {
        home: 105.2,
        away: 109.8
      },
      recentForm: {
        home: 0.65, // Win rate last 10
        away: 0.55
      },
      restDays: {
        home: 2,
        away: 1
      },
      travelDistance: {
        home: 0, // Miles
        away: 1200
      },
      homeCourtAdvantage: 3.2, // Historical points
      divisionalGame: false,
      backToBack: {
        home: false,
        away: true
      }
    };

    // Calculate prediction using regression model
    let homeScore = 110; // Base
    let awayScore = 107;

    // Apply factors
    homeScore += (factors.offensiveEfficiency.home - 110) * 0.4;
    awayScore += (factors.offensiveEfficiency.away - 110) * 0.4;
    homeScore -= (factors.defensiveEfficiency.away - 108) * 0.3;
    awayScore -= (factors.defensiveEfficiency.home - 108) * 0.3;
    homeScore += factors.homeCourtAdvantage;
    homeScore += (factors.restDays.home - factors.restDays.away) * 0.8;
    awayScore -= factors.backToBack.away ? 3 : 0;

    const margin = homeScore - awayScore;
    const total = homeScore + awayScore;

    return {
      gameId,
      prediction: {
        homeScore: Math.round(homeScore * 10) / 10,
        awayScore: Math.round(awayScore * 10) / 10,
        margin: Math.round(margin * 10) / 10,
        total: Math.round(total * 10) / 10,
        confidence: 0.75
      },
      factors,
      modelEdge: {
        spreadEdge: margin - (-3.0), // Current line is -3
        totalEdge: total - 48.5, // Current total is 48.5
        moneylineEdge: this.convertSpreadToML(margin) - (-155)
      }
    };
  }

  /**
   * Calculate injury impact
   */
  calculateInjuryImpact(gameId: string): InjuryImpact {
    // Mock injury data
    const injuries = [
      {
        team: 'home' as const,
        player: 'Star QB',
        position: 'QB',
        impact: -7.5, // Points impact
        confidence: 0.92,
        historicalWithout: {
          record: '2-8 ATS',
          avgMargin: -6.3,
          sampleSize: 10
        }
      }
    ];

    const totalImpact = {
      home: -7.5,
      away: 0,
      netSpreadImpact: -7.5 // Negative = hurts home team
    };

    return {
      gameId,
      injuries,
      totalImpact
    };
  }

  /**
   * Calculate risk management recommendations
   */
  calculateRiskManagement(bankroll: number, currentExposure: number, edge: number, _confidence: number): RiskManagement {
    const exposurePercentage = (currentExposure / bankroll) * 100;
    const remaining = bankroll - currentExposure;

    // Kelly Criterion: f* = (bp - q) / b
    // where b = decimal odds - 1, p = win probability, q = 1-p
    const winProbability = 0.524 + (edge * 0.01); // Base 52.4% + edge
    const decimalOdds = 1.91; // -110 American
    const b = decimalOdds - 1;
    const q = 1 - winProbability;
    const kellyFraction = ((b * winProbability) - q) / b;

    const fullKelly = Math.max(0, kellyFraction * bankroll);
    const fractionalKelly = fullKelly * 0.25; // Quarter Kelly (recommended)
    const conservative = fullKelly * 0.10; // 10% Kelly (very safe)

    const alerts = {
      overexposed: exposurePercentage > 30,
      correlatedBets: false, // Would check actual bet correlations
      stopLossHit: (bankroll - currentExposure) < bankroll * 0.80
    };

    return {
      bankroll,
      exposure: {
        current: currentExposure,
        percentage: exposurePercentage,
        remaining
      },
      kellyStake: {
        full: Math.round(fullKelly * 100) / 100,
        fractional: Math.round(fractionalKelly * 100) / 100,
        conservative: Math.round(conservative * 100) / 100
      },
      alerts
    };
  }

  // Private helper methods

  private calculateCLVFactor(currentLine: number, projectedClosing: number): EdgeFactor {
    const expectedCLV = currentLine - projectedClosing;
    let score = 50 + (expectedCLV * 10); // 1 point CLV = 10 points
    score = Math.max(0, Math.min(100, score));

    return {
      score,
      weight: 25,
      details: `Expected CLV: ${expectedCLV.toFixed(1)} points`,
      data: { currentLine, projectedClosing, expectedCLV }
    };
  }

  private calculateSharpFactor(sharpConsensus: number, publicConsensus: number): EdgeFactor {
    // Best when sharps high (>70%) and public opposite
    const sharpStrength = sharpConsensus > 70 || sharpConsensus < 30 ? 30 : 0;
    const fadePotential = Math.abs(sharpConsensus - publicConsensus) > 30 ? 20 : 0;
    const score = Math.min(100, sharpStrength + fadePotential + 50);

    return {
      score,
      weight: 20,
      details: `Sharp: ${sharpConsensus.toFixed(0)}%, Public: ${publicConsensus.toFixed(0)}%`,
      data: { sharpConsensus, publicConsensus }
    };
  }

  private calculateModelFactor(currentLine: number, modelPrediction: number): EdgeFactor {
    const edge = Math.abs(currentLine - modelPrediction);
    let score = 50 + (edge * 15); // 1 point edge = 15 points
    score = Math.max(0, Math.min(100, score));

    return {
      score,
      weight: 20,
      details: `Model edge: ${edge.toFixed(1)} points`,
      data: { currentLine, modelPrediction, edge }
    };
  }

  private calculateSituationalFactor(factors: any): EdgeFactor {
    let score = 50;

    // Add points for favorable situations
    if (factors?.restAdvantage > 1) score += 10;
    if (factors?.backToBackOpponent) score += 15;
    if (factors?.divisionalRevenge) score += 10;
    if (factors?.weatherAdvantage) score += 5;

    return {
      score: Math.min(100, score),
      weight: 15,
      details: 'Situational advantages analyzed',
      data: factors
    };
  }

  private calculateLineMovementFactor(opening: number, current: number, sharp: number, _publicPercent: number): EdgeFactor {
    const movement = Math.abs(current - opening);
    const isRLM = (current > opening && sharp < 50) || (current < opening && sharp > 50);

    let score = 50;
    if (movement > 2) score += 20;
    if (isRLM) score += 30;

    return {
      score: Math.min(100, score),
      weight: 10,
      details: `Line moved ${movement.toFixed(1)} points`,
      data: { opening, current, movement, isRLM }
    };
  }

  private calculateMarketInefficiency(currentLine: number, model: number, sharp: number): EdgeFactor {
    const modelDisagreement = Math.abs(currentLine - model);
    const sharpExtreme = sharp > 75 || sharp < 25;

    let score = 50 + (modelDisagreement * 10);
    if (sharpExtreme) score += 15;

    return {
      score: Math.min(100, score),
      weight: 10,
      details: 'Market efficiency analysis',
      data: { modelDisagreement, sharpExtreme }
    };
  }

  private calculateConfidence(scores: number[]): number {
    // Confidence based on score agreement
    const avg = scores.reduce((a, b) => a + b) / scores.length;
    const variance = scores.reduce((sum, score) => sum + Math.pow(score - avg, 2), 0) / scores.length;
    const stdDev = Math.sqrt(variance);

    // Lower variance = higher confidence
    return Math.max(0.3, Math.min(1.0, 1 - (stdDev / 100)));
  }

  private calculateKellyStake(edge: number, confidence: number): number {
    if (edge <= 0) return 0;
    const kelly = edge * confidence;
    const fractionalKelly = kelly * 0.25; // Quarter Kelly
    return Math.min(5, Math.max(0, fractionalKelly * 100)); // 0-5% of bankroll
  }

  private generateWarnings(overall: number, sharp: number, publicPercent: number, factors: any): string[] {
    const warnings: string[] = [];

    if (overall < 40) warnings.push('⚠️ Low edge score - avoid this bet');
    if (sharp < 40 && sharp > 60) warnings.push('⚠️ No sharp consensus');
    if (Math.abs(sharp - publicPercent) < 10) warnings.push('⚠️ Sharp and public agree (efficient line)');
    if (factors?.primetime) warnings.push('⚠️ Primetime game (sharpest lines)');
    if (factors?.popularTeam) warnings.push('⚠️ Popular team (potential public inflation)');

    return warnings;
  }

  private generateInsights(overall: number, clv: EdgeFactor, sharp: EdgeFactor, model: EdgeFactor): string[] {
    const insights: string[] = [];

    if (overall >= 75) insights.push('✅ STRONG BET - Multiple factors align');
    if (clv.score >= 70) insights.push('💎 Excellent CLV opportunity');
    if (sharp.score >= 75) insights.push('🎯 Strong sharp consensus');
    if (model.score >= 70) insights.push('📊 Significant model edge');
    if (clv.score >= 70 && sharp.score >= 70) insights.push('🔥 CLV + Sharp consensus = Elite setup');

    return insights;
  }

  private findBestSpread(books: SharpBookComparison['books']): { book: string; line: number; odds: number } {
    let best = { book: '', line: 0, odds: -200 };
    Object.entries(books).forEach(([name, data]) => {
      if (data.spreadOdds > best.odds) {
        best = { book: name, line: data.spread, odds: data.spreadOdds };
      }
    });
    return best;
  }

  private findBestTotal(books: SharpBookComparison['books']): { book: string; line: number; odds: number } {
    let best = { book: '', line: 0, odds: -200 };
    Object.entries(books).forEach(([name, data]) => {
      if (data.totalOdds > best.odds) {
        best = { book: name, line: data.total, odds: data.totalOdds };
      }
    });
    return best;
  }

  private findBestMoneyline(books: SharpBookComparison['books'], side: 'home' | 'away'): { book: string; odds: number } {
    let best = { book: '', odds: side === 'home' ? -1000 : -1000 };
    Object.entries(books).forEach(([name, data]) => {
      const odds = side === 'home' ? data.moneylineHome : data.moneylineAway;
      if ((side === 'home' && odds > best.odds) || (side === 'away' && odds > best.odds)) {
        best = { book: name, odds };
      }
    });
    return best;
  }

  private findDiscrepancies(books: SharpBookComparison['books']): SharpBookComparison['discrepancies'] {
    const discrepancies: SharpBookComparison['discrepancies'] = [];

    const spreads = Object.values(books).map(b => b.spread);
    const maxSpread = Math.max(...spreads);
    const minSpread = Math.min(...spreads);

    if (maxSpread - minSpread >= 2) {
      discrepancies.push({
        type: 'spread',
        description: `${(maxSpread - minSpread).toFixed(1)} point spread discrepancy - potential arbitrage`,
        edge: ((maxSpread - minSpread) / 2) * 2.5 // Rough EV calculation
      });
    }

    return discrepancies;
  }

  private convertSpreadToML(spread: number): number {
    // Rough conversion
    if (spread > 0) return Math.round(100 + (spread * 25));
    return Math.round(-100 - (Math.abs(spread) * 25));
  }
};

export const edgeService = new EdgeService();
