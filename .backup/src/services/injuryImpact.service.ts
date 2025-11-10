/**
 * Injury Impact Quantification Service
 * Quantify how player absences affect spread and total
 *
 * METHODOLOGY:
 * - Historical data: Team performance WITH vs WITHOUT key players
 * - Position multipliers (QB > RB > WR)
 * - Usage rate impact (30% usage = bigger impact)
 * - Replacement player quality
 */

export type InjuryImpact = {
  player: string;
  team: string;
  position: 'QB' | 'RB' | 'WR' | 'TE' | 'OL' | 'DL' | 'LB' | 'DB';
  status: 'out' | 'doubtful' | 'questionable' | 'probable';

  // Impact on spread
  spreadImpact: number; // Points (negative = hurts team)
  confidence: number; // 0-1

  // Historical data
  historicalWithout: {
    record: string; // "2-8 ATS"
    avgMargin: number; // Average margin without player
    sampleSize: number; // Games
  };

  historicalWith: {
    record: string;
    avgMargin: number;
    sampleSize: number;
  };

  // Player metrics
  usageRate: number; // 0-100 (30 = 30% of plays)
  replacementQuality: number; // 0-100 (higher = better backup)
  positionImportance: number; // Multiplier based on position

  // Breakdown
  offensiveImpact: number;
  defensiveImpact: number;
  totalImpact: number; // Impact on O/U

  reasoning: string;
};

export type TeamInjuryReport = {
  team: string;
  game: string;

  injuries: InjuryImpact[];

  totalSpreadImpact: number; // Combined impact
  totalTotalImpact: number; // Impact on O/U

  severity: 'critical' | 'significant' | 'moderate' | 'minor';

  summary: string;
};

class InjuryImpactService {
  // Position importance multipliers
  private readonly POSITION_MULTIPLIERS: Record<string, number> = {
    QB: 3.0, // QB is 3x more important
    RB: 1.2,
    WR: 1.0,
    TE: 0.9,
    OL: 1.5, // Elite OL very important
    DL: 1.3,
    LB: 1.0,
    DB: 0.9
  };

  /**
   * Calculate injury impact for a player
   */
  calculateInjuryImpact(
    player: string,
    team: string,
    position: InjuryImpact['position'],
    status: InjuryImpact['status'],
    usageRate: number,
    replacementQuality: number
  ): InjuryImpact {
    const positionMultiplier = this.POSITION_MULTIPLIERS[position] || 1.0;

    // Base impact calculation
    // Formula: (Usage Rate / 100) * (100 - Replacement Quality) / 100 * Position Multiplier * Status Multiplier
    const statusMultiplier = this.getStatusMultiplier(status);
    const baseImpact = (usageRate / 100) * ((100 - replacementQuality) / 100) * positionMultiplier * statusMultiplier;

    // Scale to points
    const spreadImpact = -(baseImpact * 2.5); // Negative because it hurts the team

    // Calculate confidence based on sample size and clarity
    const confidence = this.calculateConfidence(status, position, usageRate);

    // Generate historical data (in production, pull from database)
    const historicalWith = this.generateHistoricalData(team, player, true);
    const historicalWithout = this.generateHistoricalData(team, player, false);

    // Break down impacts
    const offensiveImpact = position === 'QB' || position === 'RB' || position === 'WR' || position === 'TE' || position === 'OL'
      ? spreadImpact
      : 0;
    const defensiveImpact = position === 'DL' || position === 'LB' || position === 'DB'
      ? spreadImpact
      : 0;

    // Total impact (on O/U) - offense impacts more than defense
    const totalImpact = position === 'QB' || position === 'RB' || position === 'WR'
      ? Math.abs(spreadImpact) * 1.5
      : Math.abs(spreadImpact) * 0.8;

    const reasoning = this.generateReasoning(player, position, spreadImpact, usageRate, replacementQuality);

    return {
      player,
      team,
      position,
      status,
      spreadImpact: Math.round(spreadImpact * 10) / 10,
      confidence,
      historicalWith,
      historicalWithout,
      usageRate,
      replacementQuality,
      positionImportance: positionMultiplier,
      offensiveImpact: Math.round(offensiveImpact * 10) / 10,
      defensiveImpact: Math.round(defensiveImpact * 10) / 10,
      totalImpact: Math.round(totalImpact * 10) / 10,
      reasoning
    };
  }

  /**
   * Get full team injury report
   */
  getTeamInjuryReport(team: string, game: string): TeamInjuryReport {
    // Mock injuries for demo
    const mockInjuries = this.generateMockInjuries(team);

    // Calculate totals
    const totalSpreadImpact = mockInjuries.reduce((sum, inj) => sum + inj.spreadImpact, 0);
    const totalTotalImpact = mockInjuries.reduce((sum, inj) => sum + inj.totalImpact, 0);

    // Determine severity
    let severity: TeamInjuryReport['severity'] = 'minor';
    if (Math.abs(totalSpreadImpact) >= 7) severity = 'critical';
    else if (Math.abs(totalSpreadImpact) >= 4) severity = 'significant';
    else if (Math.abs(totalSpreadImpact) >= 2) severity = 'moderate';

    // Generate summary
    const summary = this.generateSummary(mockInjuries, totalSpreadImpact);

    return {
      team,
      game,
      injuries: mockInjuries,
      totalSpreadImpact: Math.round(totalSpreadImpact * 10) / 10,
      totalTotalImpact: Math.round(totalTotalImpact * 10) / 10,
      severity,
      summary
    };
  }

  /**
   * Compare injury impacts between teams
   */
  compareTeamInjuries(homeTeam: string, awayTeam: string, game: string): {
    home: TeamInjuryReport;
    away: TeamInjuryReport;
    netAdvantage: number; // Positive = home advantage
    recommendation: string;
  } {
    const homeReport = this.getTeamInjuryReport(homeTeam, game);
    const awayReport = this.getTeamInjuryReport(awayTeam, game);

    // Net advantage = home's injuries vs away's injuries
    const netAdvantage = awayReport.totalSpreadImpact - homeReport.totalSpreadImpact;

    let recommendation = '';
    if (Math.abs(netAdvantage) < 2) {
      recommendation = 'Injuries roughly offset - Not a major factor';
    } else if (netAdvantage > 2) {
      recommendation = `${homeTeam} has significant injury advantage (+${netAdvantage.toFixed(1)} points)`;
    } else {
      recommendation = `${awayTeam} has significant injury advantage (${netAdvantage.toFixed(1)} points)`;
    }

    return {
      home: homeReport,
      away: awayReport,
      netAdvantage: Math.round(netAdvantage * 10) / 10,
      recommendation
    };
  }

  // Private helper methods

  private getStatusMultiplier(status: InjuryImpact['status']): number {
    const multipliers: Record<InjuryImpact['status'], number> = {
      out: 1.0, // Full impact
      doubtful: 0.75, // 75% chance out
      questionable: 0.40, // 40% chance out
      probable: 0.10 // 10% chance out
    };
    return multipliers[status];
  }

  private calculateConfidence(
    status: InjuryImpact['status'],
    position: InjuryImpact['position'],
    usageRate: number
  ): number {
    let confidence = 0.70; // Base

    // Status confidence
    if (status === 'out') confidence += 0.20;
    else if (status === 'doubtful') confidence += 0.10;
    else if (status === 'questionable') confidence -= 0.10;

    // High-usage players easier to quantify
    if (usageRate > 30) confidence += 0.10;

    // QB impact most certain
    if (position === 'QB') confidence += 0.15;

    return Math.max(0.50, Math.min(0.95, confidence));
  }

  private generateHistoricalData(_team: string, _player: string, withPlayer: boolean): InjuryImpact['historicalWith'] {
    // Mock historical data (in production, query database)
    if (withPlayer) {
      return {
        record: '12-5 ATS',
        avgMargin: 4.2,
        sampleSize: 17
      };
    } else {
      return {
        record: '2-8 ATS',
        avgMargin: -6.3,
        sampleSize: 10
      };
    }
  }

  private generateReasoning(
    player: string,
    position: InjuryImpact['position'],
    spreadImpact: number,
    usageRate: number,
    replacementQuality: number
  ): string {
    const impactDesc = Math.abs(spreadImpact) >= 5 ? 'massive' : Math.abs(spreadImpact) >= 3 ? 'significant' : Math.abs(spreadImpact) >= 1.5 ? 'moderate' : 'minor';

    let reasoning = `${player} (${position}) has ${impactDesc} impact: ${spreadImpact.toFixed(1)} points. `;

    if (usageRate > 30) {
      reasoning += `High usage rate (${usageRate}%) makes absence critical. `;
    }

    if (replacementQuality < 40) {
      reasoning += `Poor replacement quality (${replacementQuality}/100) amplifies impact. `;
    } else if (replacementQuality > 70) {
      reasoning += `Quality backup (${replacementQuality}/100) mitigates some impact. `;
    }

    if (position === 'QB') {
      reasoning += 'QB position is 3x multiplier - game-changing absence.';
    }

    return reasoning;
  }

  private generateMockInjuries(team: string): InjuryImpact[] {
    // Generate realistic mock injuries
    const mockPlayers = [
      { name: 'Patrick Mahomes', position: 'QB' as const, status: 'out' as const, usage: 100, replacement: 45 },
      { name: 'Travis Kelce', position: 'TE' as const, status: 'questionable' as const, usage: 28, replacement: 65 },
      { name: 'Chris Jones', position: 'DL' as const, status: 'probable' as const, usage: 22, replacement: 70 }
    ];

    // Randomly select 0-2 injuries
    const numInjuries = Math.floor(Math.random() * 3);
    const selectedPlayers = mockPlayers.slice(0, numInjuries);

    return selectedPlayers.map(p =>
      this.calculateInjuryImpact(p.name, team, p.position, p.status, p.usage, p.replacement)
    );
  }

  private generateSummary(injuries: InjuryImpact[], totalImpact: number): string {
    if (injuries.length === 0) {
      return 'No significant injuries reported';
    }

    const criticalInjuries = injuries.filter(i => Math.abs(i.spreadImpact) >= 3);

    if (criticalInjuries.length > 0) {
      const players = criticalInjuries.map(i => `${i.player} (${i.position})`).join(', ');
      return `CRITICAL: ${players} out. Total impact: ${totalImpact.toFixed(1)} points`;
    }

    return `${injuries.length} injuries with combined ${Math.abs(totalImpact).toFixed(1)} point impact`;
  }

  /**
   * Get all teams with significant injuries
   */
  getSevereInjuryGames(): Array<{
    game: string;
    team: string;
    severity: 'critical' | 'significant';
    impact: number;
    keyPlayers: string[];
  }> {
    // Mock severe injury games
    return [
      {
        game: 'Chiefs vs Bills',
        team: 'Chiefs',
        severity: 'critical',
        impact: -7.5,
        keyPlayers: ['Patrick Mahomes (QB)']
      },
      {
        game: '49ers vs Cowboys',
        team: '49ers',
        severity: 'significant',
        impact: -4.2,
        keyPlayers: ['Christian McCaffrey (RB)', 'Deebo Samuel (WR)']
      }
    ];
  }
};

export const injuryImpactService = new InjuryImpactService();
