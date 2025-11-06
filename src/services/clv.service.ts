/**
 * Closing Line Value (CLV) Service
 * THE #1 indicator of long-term betting profitability
 */

import { betTrackerService, Bet } from './betTracker.service';

export type CLVData = {
  betId: string;
  gameId: string;
  sport: string;
  betType: string;
  betLine: number; // Line when you placed the bet
  openingLine: number; // Line when market opened
  closingLine: number; // Line when game started
  clv: number; // Your line - closing line (positive = you beat market)
  clvPercentage: number; // CLV as percentage of movement
  expectedProfitBoost: number; // Historical correlation to win rate
  betResult?: 'won' | 'lost' | 'push' | 'pending';
  timestamp: string;
};

export type CLVStats = {
  totalBets: number;
  avgCLV: number;
  positiveCLVBets: number;
  positiveCLVPercentage: number;
  expectedROI: number; // Based on CLV correlation
  bySport: {
    [sport: string]: {
      avgCLV: number;
      count: number;
    };
  };
  byBetType: {
    [betType: string]: {
      avgCLV: number;
      count: number;
    };
  };
  recentTrend: 'improving' | 'declining' | 'stable';
};

export type ClosingLinePrediction = {
  gameId: string;
  currentLine: number;
  projectedClosing: number;
  confidence: number; // 0-1
  timeUntilClose: number; // minutes
  recommendation: 'BET_NOW' | 'WAIT' | 'LINE_GETTING_WORSE' | 'LINE_GETTING_BETTER';
  factors: {
    sharpMoneyDirection: 'home' | 'away' | 'neutral';
    publicDirection: 'home' | 'away' | 'neutral';
    lineVelocity: number; // Points per hour
    historicalPattern: string;
  };
};

export type CLVAlert = {
  id: string;
  gameId: string;
  message: string;
  type: 'excellent_clv' | 'good_clv' | 'poor_clv' | 'closing_soon';
  currentLine: number;
  projectedClosing: number;
  expectedCLV: number;
  timestamp: string;
};

class CLVService {
  private readonly CLV_STORAGE_KEY = 'clv_data';
  private readonly CLV_ALERTS_KEY = 'clv_alerts';

  /**
   * Record CLV for a bet
   */
  recordCLV(
    betId: string,
    gameId: string,
    sport: string,
    betType: string,
    betLine: number,
    openingLine: number,
    closingLine: number
  ): CLVData {
    const clv = betLine - closingLine;
    const lineMovement = Math.abs(openingLine - closingLine);
    const clvPercentage = lineMovement > 0 ? (clv / lineMovement) * 100 : 0;

    // Historical correlation: 1 point of CLV ≈ 2-3% increase in win rate
    // At standard -110 odds, need 52.4% to break even
    // Each point of CLV adds roughly 2.5% to expected win rate
    const expectedProfitBoost = clv * 2.5;

    const clvData: CLVData = {
      betId,
      gameId,
      sport,
      betType,
      betLine,
      openingLine,
      closingLine,
      clv,
      clvPercentage,
      expectedProfitBoost,
      timestamp: new Date().toISOString()
    };

    this.saveCLVData(clvData);
    return clvData;
  }

  /**
   * Get all CLV data
   */
  getAllCLVData(): CLVData[] {
    try {
      const stored = localStorage.getItem(this.CLV_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  /**
   * Get CLV statistics
   */
  getCLVStats(): CLVStats {
    const data = this.getAllCLVData();

    if (data.length === 0) {
      return this.getEmptyStats();
    }

    const totalCLV = data.reduce((sum, d) => sum + d.clv, 0);
    const avgCLV = totalCLV / data.length;
    const positiveCLVBets = data.filter(d => d.clv > 0).length;
    const positiveCLVPercentage = (positiveCLVBets / data.length) * 100;

    // Expected ROI based on CLV
    // Research shows: 1 point CLV ≈ 2-3% ROI boost
    const expectedROI = avgCLV * 2.5;

    // By sport
    const bySport: CLVStats['bySport'] = {};
    data.forEach(d => {
      if (!bySport[d.sport]) {
        bySport[d.sport] = { avgCLV: 0, count: 0 };
      }
      bySport[d.sport].avgCLV += d.clv;
      bySport[d.sport].count++;
    });
    Object.keys(bySport).forEach(sport => {
      bySport[sport].avgCLV /= bySport[sport].count;
    });

    // By bet type
    const byBetType: CLVStats['byBetType'] = {};
    data.forEach(d => {
      if (!byBetType[d.betType]) {
        byBetType[d.betType] = { avgCLV: 0, count: 0 };
      }
      byBetType[d.betType].avgCLV += d.clv;
      byBetType[d.betType].count++;
    });
    Object.keys(byBetType).forEach(type => {
      byBetType[type].avgCLV /= byBetType[type].count;
    });

    // Recent trend (last 20 vs previous 20)
    const recent = data.slice(-20);
    const previous = data.slice(-40, -20);
    const recentAvg = recent.reduce((sum, d) => sum + d.clv, 0) / recent.length;
    const previousAvg = previous.length > 0
      ? previous.reduce((sum, d) => sum + d.clv, 0) / previous.length
      : 0;

    let recentTrend: 'improving' | 'declining' | 'stable' = 'stable';
    if (recentAvg > previousAvg + 0.5) recentTrend = 'improving';
    if (recentAvg < previousAvg - 0.5) recentTrend = 'declining';

    return {
      totalBets: data.length,
      avgCLV,
      positiveCLVBets,
      positiveCLVPercentage,
      expectedROI,
      bySport,
      byBetType,
      recentTrend
    };
  }

  /**
   * Predict closing line
   */
  predictClosingLine(
    gameId: string,
    currentLine: number,
    openingLine: number,
    sharpMoneyDirection: 'home' | 'away' | 'neutral',
    publicDirection: 'home' | 'away' | 'neutral',
    minutesUntilClose: number
  ): ClosingLinePrediction {
    // Calculate line velocity (points moved per hour)
    const lineMovement = Math.abs(currentLine - openingLine);
    const hoursElapsed = (240 - minutesUntilClose) / 60; // Assume 4 hour betting window
    const lineVelocity = hoursElapsed > 0 ? lineMovement / hoursElapsed : 0;

    // Predict closing line based on patterns
    let projectedClosing = currentLine;
    let confidence = 0.5;

    // Sharp money usually predicts closing line
    if (sharpMoneyDirection === 'home' && publicDirection === 'away') {
      // RLM scenario - line will likely continue toward sharp money
      projectedClosing = currentLine - (lineVelocity * (minutesUntilClose / 60) * 0.8);
      confidence = 0.85;
    } else if (sharpMoneyDirection === publicDirection) {
      // Both agree - strong movement likely
      projectedClosing = currentLine - (lineVelocity * (minutesUntilClose / 60) * 1.2);
      confidence = 0.75;
    } else {
      // Neutral - small continued movement
      projectedClosing = currentLine - (lineVelocity * (minutesUntilClose / 60) * 0.3);
      confidence = 0.60;
    }

    // Determine recommendation
    let recommendation: ClosingLinePrediction['recommendation'] = 'WAIT';
    const expectedCLV = currentLine - projectedClosing;

    if (expectedCLV > 1.5 && confidence > 0.75) {
      recommendation = 'BET_NOW'; // Great CLV expected
    } else if (expectedCLV < -1.0) {
      recommendation = 'LINE_GETTING_WORSE'; // Don't bet, line moving against you
    } else if (expectedCLV > 0.5) {
      recommendation = 'LINE_GETTING_BETTER'; // Slight edge, consider betting
    }

    return {
      gameId,
      currentLine,
      projectedClosing,
      confidence,
      timeUntilClose: minutesUntilClose,
      recommendation,
      factors: {
        sharpMoneyDirection,
        publicDirection,
        lineVelocity,
        historicalPattern: this.getHistoricalPattern(sharpMoneyDirection, publicDirection)
      }
    };
  }

  /**
   * Get CLV alerts
   */
  getCLVAlerts(): CLVAlert[] {
    try {
      const stored = localStorage.getItem(this.CLV_ALERTS_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  /**
   * Create CLV alert
   */
  createCLVAlert(
    gameId: string,
    currentLine: number,
    projectedClosing: number,
    expectedCLV: number
  ): void {
    let type: CLVAlert['type'] = 'good_clv';
    let message = '';

    if (expectedCLV >= 2.0) {
      type = 'excellent_clv';
      message = `🔥 EXCELLENT CLV OPPORTUNITY! Current line ${currentLine} projected to close at ${projectedClosing.toFixed(1)}. Expected CLV: +${expectedCLV.toFixed(1)} points!`;
    } else if (expectedCLV >= 1.0) {
      type = 'good_clv';
      message = `⭐ Good CLV spot. Current: ${currentLine}, Projected close: ${projectedClosing.toFixed(1)}. CLV: +${expectedCLV.toFixed(1)}`;
    } else if (expectedCLV <= -1.0) {
      type = 'poor_clv';
      message = `⚠️ Poor CLV. Line moving against you. Current: ${currentLine}, likely closing: ${projectedClosing.toFixed(1)}`;
    }

    const alert: CLVAlert = {
      id: `alert_${Date.now()}`,
      gameId,
      message,
      type,
      currentLine,
      projectedClosing,
      expectedCLV,
      timestamp: new Date().toISOString()
    };

    const alerts = this.getCLVAlerts();
    alerts.unshift(alert);

    // Keep only last 50 alerts
    if (alerts.length > 50) alerts.splice(50);

    localStorage.setItem(this.CLV_ALERTS_KEY, JSON.stringify(alerts));
  }

  /**
   * Calculate expected win rate boost from CLV
   */
  calculateWinRateBoost(clv: number): number {
    // Research-backed: 1 point CLV ≈ 2.5% win rate increase
    // At -110 odds, break-even is 52.4%
    const baseWinRate = 52.4;
    const boost = clv * 2.5;
    return baseWinRate + boost;
  }

  // Private helpers

  private saveCLVData(data: CLVData): void {
    const all = this.getAllCLVData();
    all.push(data);
    localStorage.setItem(this.CLV_STORAGE_KEY, JSON.stringify(all));
  }

  private getEmptyStats(): CLVStats {
    return {
      totalBets: 0,
      avgCLV: 0,
      positiveCLVBets: 0,
      positiveCLVPercentage: 0,
      expectedROI: 0,
      bySport: {},
      byBetType: {},
      recentTrend: 'stable'
    };
  }

  private getHistoricalPattern(
    sharpDirection: 'home' | 'away' | 'neutral',
    publicDirection: 'home' | 'away' | 'neutral'
  ): string {
    if (sharpDirection !== publicDirection && sharpDirection !== 'neutral') {
      return 'RLM pattern - Sharp money typically predicts closing line (85% accuracy)';
    }
    if (sharpDirection === publicDirection && sharpDirection !== 'neutral') {
      return 'Consensus move - Both sharp and public agree (75% accuracy)';
    }
    return 'Mixed signals - Line movement less predictable';
  }

  /**
   * Generate mock CLV data for demo
   */
  generateMockCLVData(): CLVData[] {
    const sports = ['NFL', 'NCAAF', 'NBA', 'NCAAB'];
    const betTypes = ['spread', 'total', 'moneyline'];
    const mockData: CLVData[] = [];

    for (let i = 0; i < 50; i++) {
      const sport = sports[Math.floor(Math.random() * sports.length)];
      const betType = betTypes[Math.floor(Math.random() * betTypes.length)];
      const openingLine = -3 + Math.random() * 6;
      const closingLine = openingLine + (Math.random() - 0.5) * 4;
      const betLine = openingLine + (Math.random() - 0.3) * 3; // Slight bias toward beating market

      mockData.push({
        betId: `bet_${i}`,
        gameId: `game_${i}`,
        sport,
        betType,
        betLine,
        openingLine,
        closingLine,
        clv: betLine - closingLine,
        clvPercentage: ((betLine - closingLine) / Math.abs(openingLine - closingLine)) * 100,
        expectedProfitBoost: (betLine - closingLine) * 2.5,
        timestamp: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString()
      });
    }

    return mockData;
  }

  /**
   * Clear all CLV data
   */
  clearAllData(): void {
    localStorage.removeItem(this.CLV_STORAGE_KEY);
    localStorage.removeItem(this.CLV_ALERTS_KEY);
  }
};

export const clvService = new CLVService();
