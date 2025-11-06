/**
 * Player Prop Model Service
 * Statistical models for player prop betting
 */

export type PropModel = {
  propId: string;
  player: string;
  team: string;
  opponent: string;
  stat: 'points' | 'assists' | 'rebounds' | 'receptions' | 'yards' | 'touchdowns';
  projection: number;
  bookLine: number;
  edge: number; // Our projection vs book line
  edgePercentage: number;
  confidence: number; // 0-1 based on variance
  recommendedBet: 'over' | 'under' | 'pass';
  factors: PropFactors;
  historicalHitRate: number; // % of times player has gone over
};

export type PropFactors = {
  seasonAverage: number;
  last5Games: number;
  last10Games: number;
  vsOpponentCareer: number;
  usageRate: number;
  minutesProjection: number;
  opponentRanking: number; // vs position (1 = hardest matchup, 32 = easiest)
  pace: number; // Team pace (possessions per game)
  injuryImpact: number; // From teammates out
  gameScript: 'favorable' | 'neutral' | 'unfavorable';
  weatherImpact?: number; // For outdoor sports
  homeAway: 'home' | 'away';
};

export type PropAlert = {
  id: string;
  player: string;
  stat: string;
  message: string;
  edge: number;
  confidence: number;
  recommendedBet: string;
  timestamp: string;
};

class PropModelService {
  private readonly PROP_MODELS_KEY = 'prop_models';
  private readonly PROP_ALERTS_KEY = 'prop_alerts';

  /**
   * Generate prop model for a player
   */
  generatePropModel(
    player: string,
    team: string,
    opponent: string,
    stat: PropModel['stat'],
    bookLine: number
  ): PropModel {
    // Generate factors
    const factors = this.generateFactors(player, team, opponent, stat);

    // Calculate projection using weighted regression
    const projection = this.calculateProjection(factors, stat);

    // Calculate edge
    const edge = projection - bookLine;
    const edgePercentage = (edge / bookLine) * 100;

    // Calculate confidence based on variance
    const confidence = this.calculateConfidence(factors);

    // Determine recommendation
    let recommendedBet: PropModel['recommendedBet'] = 'pass';
    if (Math.abs(edge) >= 2 && confidence >= 0.70) {
      recommendedBet = edge > 0 ? 'over' : 'under';
    } else if (Math.abs(edge) >= 1.5 && confidence >= 0.75) {
      recommendedBet = edge > 0 ? 'over' : 'under';
    }

    // Historical hit rate
    const historicalHitRate = this.calculateHistoricalHitRate(factors, bookLine);

    return {
      propId: `prop_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      player,
      team,
      opponent,
      stat,
      projection,
      bookLine,
      edge,
      edgePercentage,
      confidence,
      recommendedBet,
      factors,
      historicalHitRate
    };
  }

  /**
   * Get all prop models
   */
  getAllPropModels(): PropModel[] {
    try {
      const stored = localStorage.getItem(this.PROP_MODELS_KEY);
      return stored ? JSON.parse(stored) : this.generateMockPropModels();
    } catch {
      return this.generateMockPropModels();
    }
  }

  /**
   * Get top prop picks (filtered by edge and confidence)
   */
  getTopPropPicks(minEdge: number = 1.5, minConfidence: number = 0.70): PropModel[] {
    const allProps = this.getAllPropModels();
    return allProps
      .filter(prop =>
        prop.recommendedBet !== 'pass' &&
        Math.abs(prop.edge) >= minEdge &&
        prop.confidence >= minConfidence
      )
      .sort((a, b) => {
        // Sort by edge * confidence (expected value)
        const aScore = Math.abs(a.edge) * a.confidence;
        const bScore = Math.abs(b.edge) * b.confidence;
        return bScore - aScore;
      });
  }

  /**
   * Get prop alerts
   */
  getPropAlerts(): PropAlert[] {
    try {
      const stored = localStorage.getItem(this.PROP_ALERTS_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  /**
   * Create prop alert
   */
  createPropAlert(prop: PropModel): void {
    if (prop.recommendedBet === 'pass') return;

    const alert: PropAlert = {
      id: `alert_${Date.now()}`,
      player: prop.player,
      stat: prop.stat,
      message: `${prop.player} ${prop.stat}: Projection ${prop.projection.toFixed(1)} vs Line ${prop.bookLine} (Edge: ${prop.edge >= 0 ? '+' : ''}${prop.edge.toFixed(1)})`,
      edge: prop.edge,
      confidence: prop.confidence,
      recommendedBet: prop.recommendedBet.toUpperCase(),
      timestamp: new Date().toISOString()
    };

    const alerts = this.getPropAlerts();
    alerts.unshift(alert);

    // Keep only last 50
    if (alerts.length > 50) alerts.splice(50);

    localStorage.setItem(this.PROP_ALERTS_KEY, JSON.stringify(alerts));
  }

  // Private helper methods

  private generateFactors(_player: string, _team: string, _opponent: string, stat: PropModel['stat']): PropFactors {
    // Mock factors - in production, fetch real player stats
    const base = this.getStatBaseline(stat);

    return {
      seasonAverage: base + (Math.random() - 0.5) * 5,
      last5Games: base + (Math.random() - 0.5) * 8,
      last10Games: base + (Math.random() - 0.5) * 6,
      vsOpponentCareer: base + (Math.random() - 0.5) * 7,
      usageRate: 20 + Math.random() * 15, // 20-35%
      minutesProjection: 30 + Math.random() * 10, // 30-40 mins
      opponentRanking: Math.floor(Math.random() * 32) + 1,
      pace: 95 + Math.random() * 10, // 95-105 possessions
      injuryImpact: (Math.random() - 0.5) * 4,
      gameScript: Math.random() > 0.6 ? 'favorable' : Math.random() > 0.3 ? 'neutral' : 'unfavorable',
      homeAway: Math.random() > 0.5 ? 'home' : 'away'
    };
  }

  private calculateProjection(factors: PropFactors, _stat: PropModel['stat']): number {
    // Weighted regression model
    let projection = 0;

    // Recent form weighted heavily (40%)
    projection += factors.last5Games * 0.25;
    projection += factors.last10Games * 0.15;

    // Season average (20%)
    projection += factors.seasonAverage * 0.20;

    // Matchup (15%)
    projection += factors.vsOpponentCareer * 0.10;
    const opponentAdjustment = (32 - factors.opponentRanking) / 32 * 3; // 0-3 point adjustment
    projection += opponentAdjustment * 0.05;

    // Usage and minutes (15%)
    const minutesMultiplier = factors.minutesProjection / 36; // Normalized to 36 mins
    projection *= minutesMultiplier * 0.15 + 0.85;

    // Pace adjustment (5%)
    const paceMultiplier = factors.pace / 100;
    projection *= paceMultiplier * 0.05 + 0.95;

    // Injury impact (5%)
    projection += factors.injuryImpact;

    // Game script impact
    if (factors.gameScript === 'favorable') projection += 1.5;
    else if (factors.gameScript === 'unfavorable') projection -= 1.0;

    // Home/away adjustment
    if (factors.homeAway === 'home') projection += 0.5;

    return Math.round(projection * 10) / 10;
  }

  private calculateConfidence(factors: PropFactors): number {
    let confidence = 0.70; // Base

    // Consistency check (variance in recent games)
    const recentVariance = Math.abs(factors.last5Games - factors.last10Games);
    if (recentVariance < 2) confidence += 0.15;
    else if (recentVariance > 5) confidence -= 0.10;

    // Usage rate reliability
    if (factors.usageRate > 25) confidence += 0.10;
    if (factors.usageRate < 15) confidence -= 0.10;

    // Minutes certainty
    if (factors.minutesProjection > 35) confidence += 0.05;

    return Math.max(0.40, Math.min(0.95, confidence));
  }

  private calculateHistoricalHitRate(factors: PropFactors, bookLine: number): number {
    // Simplified hit rate calculation
    // In production, use actual game logs
    const avg = factors.seasonAverage;
    const std = avg * 0.25; // Assume 25% std deviation

    // Calculate probability of going over using normal distribution approximation
    const z = (bookLine - avg) / std;
    const hitRate = this.normalCDF(-z) * 100;

    return Math.round(hitRate * 10) / 10;
  }

  private normalCDF(z: number): number {
    // Approximation of standard normal CDF
    const t = 1 / (1 + 0.2316419 * Math.abs(z));
    const d = 0.3989423 * Math.exp(-z * z / 2);
    const prob = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
    return z > 0 ? 1 - prob : prob;
  }

  private getStatBaseline(stat: PropModel['stat']): number {
    const baselines: Record<PropModel['stat'], number> = {
      points: 18,
      assists: 5,
      rebounds: 7,
      receptions: 5,
      yards: 65,
      touchdowns: 0.7
    };
    return baselines[stat] || 10;
  }

  /**
   * Generate mock prop models for demo
   */
  private generateMockPropModels(): PropModel[] {
    const players = [
      { name: 'Patrick Mahomes', team: 'KC', stat: 'touchdowns' as const, line: 2.5 },
      { name: 'Josh Allen', team: 'BUF', stat: 'yards' as const, line: 275.5 },
      { name: 'Christian McCaffrey', team: 'SF', stat: 'receptions' as const, line: 5.5 },
      { name: 'Travis Kelce', team: 'KC', stat: 'yards' as const, line: 72.5 },
      { name: 'Tyreek Hill', team: 'MIA', stat: 'receptions' as const, line: 6.5 },
      { name: 'LeBron James', team: 'LAL', stat: 'points' as const, line: 24.5 },
      { name: 'Stephen Curry', team: 'GSW', stat: 'points' as const, line: 27.5 },
      { name: 'Nikola Jokic', team: 'DEN', stat: 'assists' as const, line: 9.5 },
      { name: 'Giannis Antetokounmpo', team: 'MIL', stat: 'rebounds' as const, line: 11.5 },
      { name: 'Luka Doncic', team: 'DAL', stat: 'points' as const, line: 32.5 }
    ];

    const props = players.map(p =>
      this.generatePropModel(p.name, p.team, 'OPP', p.stat, p.line)
    );

    localStorage.setItem(this.PROP_MODELS_KEY, JSON.stringify(props));
    return props;
  }

  /**
   * Clear all prop data
   */
  clearAllData(): void {
    localStorage.removeItem(this.PROP_MODELS_KEY);
    localStorage.removeItem(this.PROP_ALERTS_KEY);
  }
};

export const propModelService = new PropModelService();
