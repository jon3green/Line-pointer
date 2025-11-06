/**
 * Winning Strategy Service
 * Professional betting strategy with filters and edge scoring
 *
 * THE SYSTEM:
 * 1. Find opening lines vs current lines (2+ point moves AGAINST public = RLM)
 * 2. Verify sharp money on same side (Action Network)
 * 3. Only bet if expected CLV > 2%
 * 4. Kelly Criterion: 1-5% bankroll max
 */

import { clvService } from './clv.service';
import { sharpMoneyService } from './sharpMoney.service';
import { edgeService } from './edge.service';

export type WinningFilters = {
  sharpConsensus: number; // 0-1 (0.70 = 70%+)
  publicOnOtherSide: number; // 0-1 (0.65 = 65%+)
  lineMovedAgainstPublic: boolean;
  expectedCLVAtClose: number; // Points (1.5+)
  modelEdge: number; // Percentage (3%+)

  // Avoids
  avoidPrimetime: boolean;
  avoidPopularTeams: boolean;
  avoidLowVolume: boolean;
};

export type BankrollManagement = {
  bankroll: number;
  maxBetSize: number; // 5% = 0.05
  kellyFraction: number; // 0.25 = Quarter Kelly
  maxExposure: number; // 30% = 0.30
  stopLoss: number; // 20% = 0.20

  // Portfolio management
  maxCorrelatedBets: number; // Max 2
  diversifyBySport: boolean;

  // Current state
  currentExposure: number;
  activeBets: number;
  todayPL: number; // Profit/Loss today
};

export type ProfessionalEdgeScore = {
  overall: number; // 0-100

  factors: {
    clvExpectation: { score: number; weight: 0.25; details: string };
    sharpConsensus: { score: number; weight: 0.20; details: string };
    modelEdge: { score: number; weight: 0.20; details: string };
    situationalEdge: { score: number; weight: 0.15; details: string };
    lineMovement: { score: number; weight: 0.10; details: string };
    marketInefficiency: { score: number; weight: 0.10; details: string };
  };

  recommendation: 'STRONG BET' | 'LEAN' | 'PASS' | 'AVOID';
  suggestedStake: number; // Percentage (0-5%)
  confidence: number; // 0-1

  reasoning: string[];
  warnings: string[];
};

export type StrategyOpportunity = {
  gameId: string;
  matchup: string;
  sport: string;

  // Line information
  openingLine: number;
  currentLine: number;
  lineMovement: number;

  // Sharp indicators
  sharpConsensusPercent: number;
  publicBettingPercent: number;
  isRLM: boolean; // Reverse line movement

  // Value indicators
  expectedCLV: number;
  modelEdge: number;
  edgeScore: ProfessionalEdgeScore;

  // Action
  side: 'home' | 'away';
  recommendedStake: number; // Dollar amount
  stakePercentage: number; // Percentage of bankroll

  // Timing
  hoursUntilKickoff: number;
  actionNeeded: 'BET NOW' | 'WAIT' | 'LINE GETTING WORSE' | 'PASSED';
};

export type DailyStrategy = {
  date: string;
  opportunities: StrategyOpportunity[];
  summary: {
    totalOpportunities: number;
    strongBets: number;
    leans: number;
    passed: number;
    avgEdgeScore: number;
    potentialExposure: number;
  };
};

class StrategyService {
  private readonly DEFAULT_FILTERS: WinningFilters = {
    sharpConsensus: 0.70, // 70%+ sharp agreement
    publicOnOtherSide: 0.65, // 65%+ public on other side
    lineMovedAgainstPublic: true, // Must be RLM
    expectedCLVAtClose: 1.5, // 1.5+ points expected
    modelEdge: 0.03, // 3%+ model edge
    avoidPrimetime: true, // Avoid SNF, MNF (sharpest lines)
    avoidPopularTeams: true, // Avoid Cowboys, Lakers, etc
    avoidLowVolume: true // Avoid low volume games (trap lines)
  };

  private readonly DEFAULT_BANKROLL: BankrollManagement = {
    bankroll: 10000,
    maxBetSize: 0.05, // 5% max
    kellyFraction: 0.25, // Quarter Kelly (conservative)
    maxExposure: 0.30, // 30% total exposure
    stopLoss: 0.20, // Stop if down 20% in a day
    maxCorrelatedBets: 2,
    diversifyBySport: true,
    currentExposure: 0,
    activeBets: 0,
    todayPL: 0
  };

  /**
   * Calculate professional edge score (0-100)
   */
  calculateProfessionalEdgeScore(
    gameId: string,
    currentLine: number,
    openingLine: number,
    projectedClosing: number,
    sharpConsensusPercent: number,
    publicBettingPercent: number,
    modelPrediction: number,
    situationalFactors: {
      restAdvantage?: number;
      backToBackOpponent?: boolean;
      divisionalRevenge?: boolean;
      popularTeam?: boolean;
      primetime?: boolean;
    }
  ): ProfessionalEdgeScore {
    const factors = {
      clvExpectation: this.calculateCLVExpectationScore(currentLine, projectedClosing),
      sharpConsensus: this.calculateSharpConsensusScore(sharpConsensusPercent, publicBettingPercent),
      modelEdge: this.calculateModelEdgeScore(modelPrediction, currentLine),
      situationalEdge: this.calculateSituationalEdgeScore(situationalFactors),
      lineMovement: this.calculateLineMovementScore(openingLine, currentLine, publicBettingPercent),
      marketInefficiency: this.calculateMarketInefficiencyScore(currentLine, openingLine, sharpConsensusPercent)
    };

    // Calculate weighted overall score
    const overall =
      (factors.clvExpectation.score * 0.25) +
      (factors.sharpConsensus.score * 0.20) +
      (factors.modelEdge.score * 0.20) +
      (factors.situationalEdge.score * 0.15) +
      (factors.lineMovement.score * 0.10) +
      (factors.marketInefficiency.score * 0.10);

    // Determine recommendation
    let recommendation: ProfessionalEdgeScore['recommendation'] = 'PASS';
    if (overall >= 75) recommendation = 'STRONG BET';
    else if (overall >= 60) recommendation = 'LEAN';
    else if (overall < 40) recommendation = 'AVOID';

    // Calculate suggested stake using Kelly
    const edge = (overall - 50) / 100; // Convert to edge estimate
    const confidence = this.calculateConfidence(factors);
    const suggestedStake = this.calculateKellyStake(edge, confidence);

    // Generate reasoning
    const reasoning: string[] = [];
    const warnings: string[] = [];

    if (factors.clvExpectation.score >= 75) {
      reasoning.push(`Excellent CLV expectation: ${factors.clvExpectation.details}`);
    }
    if (factors.sharpConsensus.score >= 75) {
      reasoning.push(`Strong sharp consensus: ${factors.sharpConsensus.details}`);
    }
    if (factors.modelEdge.score >= 75) {
      reasoning.push(`Significant model edge: ${factors.modelEdge.details}`);
    }

    if (situationalFactors.primetime) {
      warnings.push('⚠️ Primetime game - Lines are sharpest, harder to find value');
    }
    if (situationalFactors.popularTeam) {
      warnings.push('⚠️ Popular team - More sharp attention, lines tighter');
    }
    if (Math.abs(currentLine - openingLine) < 0.5) {
      warnings.push('⚠️ Low line movement - Market uncertainty or trap line');
    }

    return {
      overall: Math.round(overall * 10) / 10,
      factors,
      recommendation,
      suggestedStake: Math.max(0, Math.min(5, suggestedStake)),
      confidence,
      reasoning,
      warnings
    };
  }

  /**
   * Find today's opportunities using winning filters
   */
  findOpportunities(
    bankroll: BankrollManagement = this.DEFAULT_BANKROLL,
    filters: WinningFilters = this.DEFAULT_FILTERS
  ): DailyStrategy {
    // Mock opportunities for demo (in production, scan all games)
    const mockGames = [
      {
        gameId: 'game1',
        matchup: 'Chiefs vs Bills',
        sport: 'NFL',
        openingLine: -2.0,
        currentLine: -3.5,
        sharpConsensus: 75,
        publicBetting: 35, // Public on Bills, line moved TO Chiefs
        modelPrediction: -5.0,
        projectedClosing: -4.0,
        hoursUntilKickoff: 4,
        isPrimetime: false,
        isPopularTeam: true
      },
      {
        gameId: 'game2',
        matchup: '49ers vs Cowboys',
        sport: 'NFL',
        openingLine: -7.0,
        currentLine: -8.5,
        sharpConsensus: 68,
        publicBetting: 72, // Public on 49ers, line moved WITH public (not RLM)
        modelPrediction: -9.0,
        projectedClosing: -9.0,
        hoursUntilKickoff: 8,
        isPrimetime: true,
        isPopularTeam: true
      },
      {
        gameId: 'game3',
        matchup: 'Packers vs Lions',
        sport: 'NFL',
        openingLine: -3.0,
        currentLine: -1.5,
        sharpConsensus: 72,
        publicBetting: 68, // Public on Packers, line moved TO Lions (RLM!)
        modelPrediction: -2.5,
        projectedClosing: -1.0,
        hoursUntilKickoff: 6,
        isPrimetime: false,
        isPopularTeam: false
      }
    ];

    const opportunities: StrategyOpportunity[] = [];

    for (const game of mockGames) {
      // Apply filters
      const isRLM = this.checkRLM(game.openingLine, game.currentLine, game.publicBetting);
      const expectedCLV = Math.abs(game.currentLine - game.projectedClosing);
      const modelEdge = Math.abs(game.modelPrediction - game.currentLine) / Math.abs(game.currentLine) * 100;

      // Check if passes filters
      if (filters.avoidPrimetime && game.isPrimetime) continue;
      if (filters.avoidPopularTeams && game.isPopularTeam) continue;
      if (filters.lineMovedAgainstPublic && !isRLM) continue;
      if (game.sharpConsensus < filters.sharpConsensus * 100) continue;
      if (expectedCLV < filters.expectedCLVAtClose) continue;
      if (modelEdge < filters.modelEdge * 100) continue;

      // Calculate edge score
      const edgeScore = this.calculateProfessionalEdgeScore(
        game.gameId,
        game.currentLine,
        game.openingLine,
        game.projectedClosing,
        game.sharpConsensus,
        game.publicBetting,
        game.modelPrediction,
        {
          popularTeam: game.isPopularTeam,
          primetime: game.isPrimetime
        }
      );

      // Only include if meets threshold
      if (edgeScore.overall < 55) continue;

      // Determine action needed based on CLV prediction
      let actionNeeded: StrategyOpportunity['actionNeeded'] = 'WAIT';
      if (expectedCLV > 2.0) actionNeeded = 'BET NOW';
      else if (game.currentLine !== game.projectedClosing && Math.sign(game.currentLine - game.projectedClosing) !== Math.sign(game.currentLine)) {
        actionNeeded = 'LINE GETTING WORSE';
      }

      // Calculate stake
      const stakePercentage = edgeScore.suggestedStake / 100;
      const recommendedStake = bankroll.bankroll * stakePercentage;

      opportunities.push({
        gameId: game.gameId,
        matchup: game.matchup,
        sport: game.sport,
        openingLine: game.openingLine,
        currentLine: game.currentLine,
        lineMovement: game.currentLine - game.openingLine,
        sharpConsensusPercent: game.sharpConsensus,
        publicBettingPercent: game.publicBetting,
        isRLM,
        expectedCLV,
        modelEdge,
        edgeScore,
        side: game.currentLine < 0 ? 'home' : 'away',
        recommendedStake,
        stakePercentage: stakePercentage * 100,
        hoursUntilKickoff: game.hoursUntilKickoff,
        actionNeeded
      });
    }

    // Sort by edge score
    opportunities.sort((a, b) => b.edgeScore.overall - a.edgeScore.overall);

    // Calculate summary
    const strongBets = opportunities.filter(o => o.edgeScore.recommendation === 'STRONG BET').length;
    const leans = opportunities.filter(o => o.edgeScore.recommendation === 'LEAN').length;
    const avgEdgeScore = opportunities.reduce((sum, o) => sum + o.edgeScore.overall, 0) / opportunities.length || 0;
    const potentialExposure = opportunities.reduce((sum, o) => sum + o.recommendedStake, 0);

    return {
      date: new Date().toISOString().split('T')[0],
      opportunities,
      summary: {
        totalOpportunities: opportunities.length,
        strongBets,
        leans,
        passed: mockGames.length - opportunities.length,
        avgEdgeScore,
        potentialExposure
      }
    };
  }

  // Private helper methods

  private calculateCLVExpectationScore(currentLine: number, projectedClosing: number): ProfessionalEdgeScore['factors']['clvExpectation'] {
    const clv = Math.abs(currentLine - projectedClosing);
    let score = Math.min(100, clv * 25); // 4 points = 100

    return {
      score: Math.round(score),
      weight: 0.25,
      details: `Expected CLV: ${clv >= 0 ? '+' : ''}${clv.toFixed(1)} points at close`
    };
  }

  private calculateSharpConsensusScore(sharpPercent: number, publicPercent: number): ProfessionalEdgeScore['factors']['sharpConsensus'] {
    const divergence = Math.abs(sharpPercent - publicPercent);
    let score = Math.min(100, divergence * 2); // 50% divergence = 100

    return {
      score: Math.round(score),
      weight: 0.20,
      details: `Sharp: ${sharpPercent}% vs Public: ${publicPercent}% (${divergence}% divergence)`
    };
  }

  private calculateModelEdgeScore(modelPrediction: number, currentLine: number): ProfessionalEdgeScore['factors']['modelEdge'] {
    const edge = Math.abs(modelPrediction - currentLine);
    let score = Math.min(100, edge * 15); // 6.7 points = 100

    return {
      score: Math.round(score),
      weight: 0.20,
      details: `Model: ${modelPrediction.toFixed(1)} vs Line: ${currentLine.toFixed(1)} (${edge.toFixed(1)} pt edge)`
    };
  }

  private calculateSituationalEdgeScore(factors: any): ProfessionalEdgeScore['factors']['situationalEdge'] {
    let score = 50; // Base
    let details: string[] = [];

    if (factors.restAdvantage > 2) {
      score += 20;
      details.push('+3 days rest advantage');
    }
    if (factors.backToBackOpponent) {
      score += 15;
      details.push('Opponent on back-to-back');
    }
    if (factors.divisionalRevenge) {
      score += 15;
      details.push('Divisional revenge game');
    }
    if (factors.popularTeam) {
      score -= 10;
      details.push('Popular team (tighter line)');
    }
    if (factors.primetime) {
      score -= 15;
      details.push('Primetime (sharp lines)');
    }

    return {
      score: Math.max(0, Math.min(100, Math.round(score))),
      weight: 0.15,
      details: details.join(', ') || 'No significant situational factors'
    };
  }

  private calculateLineMovementScore(openingLine: number, currentLine: number, publicPercent: number): ProfessionalEdgeScore['factors']['lineMovement'] {
    const movement = Math.abs(currentLine - openingLine);
    const isRLM = this.checkRLM(openingLine, currentLine, publicPercent);

    let score = Math.min(100, movement * 20); // 5 points = 100
    if (isRLM) score = Math.min(100, score * 1.5); // Boost for RLM

    return {
      score: Math.round(score),
      weight: 0.10,
      details: `Line moved ${movement.toFixed(1)} pts${isRLM ? ' (RLM!)' : ''}`
    };
  }

  private calculateMarketInefficiencyScore(currentLine: number, openingLine: number, sharpPercent: number): ProfessionalEdgeScore['factors']['marketInefficiency'] {
    const movement = Math.abs(currentLine - openingLine);
    const sharpAgreement = Math.abs(sharpPercent - 50) / 50; // 0-1

    let score = (movement * 10) + (sharpAgreement * 50);

    return {
      score: Math.max(0, Math.min(100, Math.round(score))),
      weight: 0.10,
      details: `Market adjusting to sharp action (${movement.toFixed(1)} pts moved)`
    };
  }

  private checkRLM(openingLine: number, currentLine: number, publicPercent: number): boolean {
    // RLM = Public heavily on one side, but line moved toward that side
    const lineMovedToward = currentLine < openingLine ? 'favorite' : 'underdog';
    const publicOn = publicPercent > 65 ? 'favorite' : publicPercent < 35 ? 'underdog' : 'neutral';

    return publicOn !== 'neutral' && lineMovedToward === publicOn;
  }

  private calculateConfidence(factors: any): number {
    // Average the factor scores, weighted
    const avgScore =
      (factors.clvExpectation.score * 0.25) +
      (factors.sharpConsensus.score * 0.20) +
      (factors.modelEdge.score * 0.20) +
      (factors.situationalEdge.score * 0.15) +
      (factors.lineMovement.score * 0.10) +
      (factors.marketInefficiency.score * 0.10);

    return Math.min(0.95, Math.max(0.50, avgScore / 100));
  }

  private calculateKellyStake(edge: number, confidence: number): number {
    // Kelly formula: f* = edge / odds
    // For spread betting at -110: roughly edge * 0.9
    // Apply confidence multiplier and fractional Kelly (0.25)

    const kelly = edge * 0.9 * confidence;
    const fractionalKelly = kelly * 0.25; // Quarter Kelly

    return Math.max(0, Math.min(5, fractionalKelly * 100)); // Return as percentage, cap at 5%
  }

  /**
   * Check if bankroll allows bet
   */
  canPlaceBet(
    betAmount: number,
    bankroll: BankrollManagement,
    isCorrelated: boolean = false
  ): { allowed: boolean; reason?: string } {
    // Check stop loss
    if (bankroll.todayPL < -(bankroll.bankroll * bankroll.stopLoss)) {
      return { allowed: false, reason: `Stop loss hit: Down ${((bankroll.todayPL / bankroll.bankroll) * 100).toFixed(1)}%` };
    }

    // Check max exposure
    const newExposure = bankroll.currentExposure + betAmount;
    if (newExposure > bankroll.bankroll * bankroll.maxExposure) {
      return { allowed: false, reason: `Max exposure (${(bankroll.maxExposure * 100)}%) would be exceeded` };
    }

    // Check bet size
    if (betAmount > bankroll.bankroll * bankroll.maxBetSize) {
      return { allowed: false, reason: `Bet exceeds max size (${(bankroll.maxBetSize * 100)}%)` };
    }

    // Check correlated bets
    if (isCorrelated && bankroll.activeBets >= bankroll.maxCorrelatedBets) {
      return { allowed: false, reason: `Max ${bankroll.maxCorrelatedBets} correlated bets already active` };
    }

    return { allowed: true };
  }
};

export const strategyService = new StrategyService();
