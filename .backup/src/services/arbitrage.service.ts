/**
 * Arbitrage & Middle Opportunity Finder
 * Scans odds across multiple bookmakers to find guaranteed profit opportunities
 */

// Type definitions
export type ArbitrageOpportunity = {
  id: string;
  type: 'arbitrage' | 'middle';
  sport: string;
  gameId: string;
  homeTeam: string;
  awayTeam: string;
  gameTime: string;
  market: 'spread' | 'total' | 'moneyline';

  // Bet legs
  leg1: {
    bookmaker: string;
    selection: string; // e.g., "Chiefs -3", "Over 48.5"
    odds: number;
    optimalStake: number;
    potentialReturn: number;
  };

  leg2: {
    bookmaker: string;
    selection: string;
    odds: number;
    optimalStake: number;
    potentialReturn: number;
  };

  // Profitability
  totalStake: number;
  guaranteedProfit: number; // For arbs
  minProfit: number; // For middles (if one bet wins)
  maxProfit: number; // For middles (if both win)
  roi: number; // Return on investment %

  // Metadata
  discoveredAt: string;
  expiresAt?: string;
  confidence: 'high' | 'medium' | 'low'; // Based on bookmaker reliability
  notes?: string;
};

export type MiddleOpportunity = ArbitrageOpportunity & {
  middleRange: {
    min: number;
    max: number;
  };
  middleProbability: number; // Estimated % chance both bets win
};

export type BookmakerOdds = {
  bookmaker: string;
  spread: {
    home: { line: number; odds: number };
    away: { line: number; odds: number };
  };
  total: {
    over: { line: number; odds: number };
    under: { line: number; odds: number };
  };
  moneyline: {
    home: number;
    away: number;
  };
};

class ArbitrageService {
  private readonly STORAGE_KEY = 'arbitrage_opportunities';
  private readonly MIN_ROI = 0.5; // Minimum 0.5% ROI to consider

  /**
   * Find all arbitrage opportunities from current games
   */
  findArbitrageOpportunities(
    gamesWithOdds: Array<{
      gameId: string;
      sport: string;
      homeTeam: string;
      awayTeam: string;
      gameTime: string;
      bookmakers: BookmakerOdds[];
    }>
  ): ArbitrageOpportunity[] {
    const opportunities: ArbitrageOpportunity[] = [];

    gamesWithOdds.forEach(game => {
      // Check spread arbitrage
      opportunities.push(...this.findSpreadArbitrage(game));

      // Check total arbitrage
      opportunities.push(...this.findTotalArbitrage(game));

      // Check moneyline arbitrage
      opportunities.push(...this.findMoneylineArbitrage(game));
    });

    // Sort by ROI (highest first)
    return opportunities.sort((a, b) => b.roi - a.roi);
  }

  /**
   * Find middle opportunities (both bets can win)
   */
  findMiddleOpportunities(
    gamesWithOdds: Array<{
      gameId: string;
      sport: string;
      homeTeam: string;
      awayTeam: string;
      gameTime: string;
      bookmakers: BookmakerOdds[];
    }>
  ): MiddleOpportunity[] {
    const opportunities: MiddleOpportunity[] = [];

    gamesWithOdds.forEach(game => {
      // Check spread middles
      opportunities.push(...this.findSpreadMiddles(game));

      // Check total middles
      opportunities.push(...this.findTotalMiddles(game));
    });

    return opportunities.sort((a, b) => b.maxProfit - a.maxProfit);
  }

  /**
   * Find spread arbitrage
   */
  private findSpreadArbitrage(game: any): ArbitrageOpportunity[] {
    const opportunities: ArbitrageOpportunity[] = [];

    for (let i = 0; i < game.bookmakers.length; i++) {
      for (let j = i + 1; j < game.bookmakers.length; j++) {
        const book1 = game.bookmakers[i];
        const book2 = game.bookmakers[j];

        // Check home vs away
        const homeOdds = this.americanToDecimal(book1.spread.home.odds);
        const awayOdds = this.americanToDecimal(book2.spread.away.odds);

        const arb = this.calculateArbitrage(homeOdds, awayOdds);

        if (arb.isArbitrage && arb.roi >= this.MIN_ROI) {
          opportunities.push({
            id: `arb_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type: 'arbitrage',
            sport: game.sport,
            gameId: game.gameId,
            homeTeam: game.homeTeam,
            awayTeam: game.awayTeam,
            gameTime: game.gameTime,
            market: 'spread',
            leg1: {
              bookmaker: book1.bookmaker,
              selection: `${game.homeTeam} ${book1.spread.home.line}`,
              odds: book1.spread.home.odds,
              optimalStake: arb.stake1,
              potentialReturn: arb.return1
            },
            leg2: {
              bookmaker: book2.bookmaker,
              selection: `${game.awayTeam} ${book2.spread.away.line}`,
              odds: book2.spread.away.odds,
              optimalStake: arb.stake2,
              potentialReturn: arb.return2
            },
            totalStake: arb.totalStake,
            guaranteedProfit: arb.profit,
            minProfit: arb.profit,
            maxProfit: arb.profit,
            roi: arb.roi,
            discoveredAt: new Date().toISOString(),
            confidence: this.assessConfidence(book1.bookmaker, book2.bookmaker)
          });
        }

        // Check away vs home (reverse)
        const awayOdds2 = this.americanToDecimal(book1.spread.away.odds);
        const homeOdds2 = this.americanToDecimal(book2.spread.home.odds);

        const arb2 = this.calculateArbitrage(awayOdds2, homeOdds2);

        if (arb2.isArbitrage && arb2.roi >= this.MIN_ROI) {
          opportunities.push({
            id: `arb_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type: 'arbitrage',
            sport: game.sport,
            gameId: game.gameId,
            homeTeam: game.homeTeam,
            awayTeam: game.awayTeam,
            gameTime: game.gameTime,
            market: 'spread',
            leg1: {
              bookmaker: book1.bookmaker,
              selection: `${game.awayTeam} ${book1.spread.away.line}`,
              odds: book1.spread.away.odds,
              optimalStake: arb2.stake1,
              potentialReturn: arb2.return1
            },
            leg2: {
              bookmaker: book2.bookmaker,
              selection: `${game.homeTeam} ${book2.spread.home.line}`,
              odds: book2.spread.home.odds,
              optimalStake: arb2.stake2,
              potentialReturn: arb2.return2
            },
            totalStake: arb2.totalStake,
            guaranteedProfit: arb2.profit,
            minProfit: arb2.profit,
            maxProfit: arb2.profit,
            roi: arb2.roi,
            discoveredAt: new Date().toISOString(),
            confidence: this.assessConfidence(book1.bookmaker, book2.bookmaker)
          });
        }
      }
    }

    return opportunities;
  }

  /**
   * Find total arbitrage
   */
  private findTotalArbitrage(game: any): ArbitrageOpportunity[] {
    const opportunities: ArbitrageOpportunity[] = [];

    for (let i = 0; i < game.bookmakers.length; i++) {
      for (let j = i + 1; j < game.bookmakers.length; j++) {
        const book1 = game.bookmakers[i];
        const book2 = game.bookmakers[j];

        const overOdds = this.americanToDecimal(book1.total.over.odds);
        const underOdds = this.americanToDecimal(book2.total.under.odds);

        const arb = this.calculateArbitrage(overOdds, underOdds);

        if (arb.isArbitrage && arb.roi >= this.MIN_ROI) {
          opportunities.push({
            id: `arb_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type: 'arbitrage',
            sport: game.sport,
            gameId: game.gameId,
            homeTeam: game.homeTeam,
            awayTeam: game.awayTeam,
            gameTime: game.gameTime,
            market: 'total',
            leg1: {
              bookmaker: book1.bookmaker,
              selection: `Over ${book1.total.over.line}`,
              odds: book1.total.over.odds,
              optimalStake: arb.stake1,
              potentialReturn: arb.return1
            },
            leg2: {
              bookmaker: book2.bookmaker,
              selection: `Under ${book2.total.under.line}`,
              odds: book2.total.under.odds,
              optimalStake: arb.stake2,
              potentialReturn: arb.return2
            },
            totalStake: arb.totalStake,
            guaranteedProfit: arb.profit,
            minProfit: arb.profit,
            maxProfit: arb.profit,
            roi: arb.roi,
            discoveredAt: new Date().toISOString(),
            confidence: this.assessConfidence(book1.bookmaker, book2.bookmaker)
          });
        }
      }
    }

    return opportunities;
  }

  /**
   * Find moneyline arbitrage
   */
  private findMoneylineArbitrage(game: any): ArbitrageOpportunity[] {
    const opportunities: ArbitrageOpportunity[] = [];

    for (let i = 0; i < game.bookmakers.length; i++) {
      for (let j = i + 1; j < game.bookmakers.length; j++) {
        const book1 = game.bookmakers[i];
        const book2 = game.bookmakers[j];

        const homeOdds = this.americanToDecimal(book1.moneyline.home);
        const awayOdds = this.americanToDecimal(book2.moneyline.away);

        const arb = this.calculateArbitrage(homeOdds, awayOdds);

        if (arb.isArbitrage && arb.roi >= this.MIN_ROI) {
          opportunities.push({
            id: `arb_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type: 'arbitrage',
            sport: game.sport,
            gameId: game.gameId,
            homeTeam: game.homeTeam,
            awayTeam: game.awayTeam,
            gameTime: game.gameTime,
            market: 'moneyline',
            leg1: {
              bookmaker: book1.bookmaker,
              selection: game.homeTeam,
              odds: book1.moneyline.home,
              optimalStake: arb.stake1,
              potentialReturn: arb.return1
            },
            leg2: {
              bookmaker: book2.bookmaker,
              selection: game.awayTeam,
              odds: book2.moneyline.away,
              optimalStake: arb.stake2,
              potentialReturn: arb.return2
            },
            totalStake: arb.totalStake,
            guaranteedProfit: arb.profit,
            minProfit: arb.profit,
            maxProfit: arb.profit,
            roi: arb.roi,
            discoveredAt: new Date().toISOString(),
            confidence: this.assessConfidence(book1.bookmaker, book2.bookmaker)
          });
        }
      }
    }

    return opportunities;
  }

  /**
   * Find spread middle opportunities
   */
  private findSpreadMiddles(game: any): MiddleOpportunity[] {
    const middles: MiddleOpportunity[] = [];

    for (let i = 0; i < game.bookmakers.length; i++) {
      for (let j = i + 1; j < game.bookmakers.length; j++) {
        const book1 = game.bookmakers[i];
        const book2 = game.bookmakers[j];

        const homeLine1 = book1.spread.home.line;
        const awayLine2 = book2.spread.away.line;

        // Check if there's a middle (e.g., bet Chiefs -2.5 and Bills +3.5)
        if (Math.abs(Math.abs(homeLine1) - Math.abs(awayLine2)) >= 1) {
          const min = Math.min(Math.abs(homeLine1), Math.abs(awayLine2));
          const max = Math.max(Math.abs(homeLine1), Math.abs(awayLine2));

          const middle = this.calculateMiddle(
            this.americanToDecimal(book1.spread.home.odds),
            this.americanToDecimal(book2.spread.away.odds)
          );

          if (middle.profitIfBothWin > 0) {
            middles.push({
              id: `middle_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              type: 'middle',
              sport: game.sport,
              gameId: game.gameId,
              homeTeam: game.homeTeam,
              awayTeam: game.awayTeam,
              gameTime: game.gameTime,
              market: 'spread',
              leg1: {
                bookmaker: book1.bookmaker,
                selection: `${game.homeTeam} ${homeLine1}`,
                odds: book1.spread.home.odds,
                optimalStake: middle.stake1,
                potentialReturn: middle.return1
              },
              leg2: {
                bookmaker: book2.bookmaker,
                selection: `${game.awayTeam} ${awayLine2}`,
                odds: book2.spread.away.odds,
                optimalStake: middle.stake2,
                potentialReturn: middle.return2
              },
              totalStake: middle.totalStake,
              guaranteedProfit: 0,
              minProfit: middle.profitIfOneWins,
              maxProfit: middle.profitIfBothWin,
              roi: (middle.profitIfBothWin / middle.totalStake) * 100,
              middleRange: { min, max },
              middleProbability: this.estimateMiddleProbability(min, max),
              discoveredAt: new Date().toISOString(),
              confidence: this.assessConfidence(book1.bookmaker, book2.bookmaker)
            });
          }
        }
      }
    }

    return middles;
  }

  /**
   * Find total middle opportunities
   */
  private findTotalMiddles(game: any): MiddleOpportunity[] {
    const middles: MiddleOpportunity[] = [];

    for (let i = 0; i < game.bookmakers.length; i++) {
      for (let j = i + 1; j < game.bookmakers.length; j++) {
        const book1 = game.bookmakers[i];
        const book2 = game.bookmakers[j];

        const overLine = book1.total.over.line;
        const underLine = book2.total.under.line;

        // Check if there's a middle (e.g., bet Over 47.5 and Under 49.5)
        if (underLine - overLine >= 1) {
          const middle = this.calculateMiddle(
            this.americanToDecimal(book1.total.over.odds),
            this.americanToDecimal(book2.total.under.odds)
          );

          if (middle.profitIfBothWin > 0) {
            middles.push({
              id: `middle_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              type: 'middle',
              sport: game.sport,
              gameId: game.gameId,
              homeTeam: game.homeTeam,
              awayTeam: game.awayTeam,
              gameTime: game.gameTime,
              market: 'total',
              leg1: {
                bookmaker: book1.bookmaker,
                selection: `Over ${overLine}`,
                odds: book1.total.over.odds,
                optimalStake: middle.stake1,
                potentialReturn: middle.return1
              },
              leg2: {
                bookmaker: book2.bookmaker,
                selection: `Under ${underLine}`,
                odds: book2.total.under.odds,
                optimalStake: middle.stake2,
                potentialReturn: middle.return2
              },
              totalStake: middle.totalStake,
              guaranteedProfit: 0,
              minProfit: middle.profitIfOneWins,
              maxProfit: middle.profitIfBothWin,
              roi: (middle.profitIfBothWin / middle.totalStake) * 100,
              middleRange: { min: overLine, max: underLine },
              middleProbability: this.estimateMiddleProbability(overLine, underLine),
              discoveredAt: new Date().toISOString(),
              confidence: this.assessConfidence(book1.bookmaker, book2.bookmaker)
            });
          }
        }
      }
    }

    return middles;
  }

  /**
   * Calculate arbitrage from two decimal odds
   */
  private calculateArbitrage(odds1: number, odds2: number, bankroll: number = 1000) {
    // Arbitrage formula: (1/odds1 + 1/odds2) < 1 means arbitrage exists
    const impliedProb1 = 1 / odds1;
    const impliedProb2 = 1 / odds2;
    const totalImpliedProb = impliedProb1 + impliedProb2;

    const isArbitrage = totalImpliedProb < 1;

    // Optimal stake distribution
    const stake1 = (bankroll * impliedProb1) / totalImpliedProb;
    const stake2 = (bankroll * impliedProb2) / totalImpliedProb;

    const return1 = stake1 * odds1;
    const return2 = stake2 * odds2;

    const totalStake = stake1 + stake2;
    const profit = Math.min(return1, return2) - totalStake;
    const roi = (profit / totalStake) * 100;

    return {
      isArbitrage,
      stake1: Math.round(stake1 * 100) / 100,
      stake2: Math.round(stake2 * 100) / 100,
      return1: Math.round(return1 * 100) / 100,
      return2: Math.round(return2 * 100) / 100,
      totalStake: Math.round(totalStake * 100) / 100,
      profit: Math.round(profit * 100) / 100,
      roi: Math.round(roi * 100) / 100
    };
  }

  /**
   * Calculate middle opportunity
   */
  private calculateMiddle(odds1: number, odds2: number, bankroll: number = 1000) {
    // For middles, bet equal amounts or slightly favor better odds
    const stake1 = bankroll / 2;
    const stake2 = bankroll / 2;

    const return1 = stake1 * odds1;
    const return2 = stake2 * odds2;

    const totalStake = stake1 + stake2;
    const profitIfOneWins = Math.max(return1, return2) - totalStake;
    const profitIfBothWin = (return1 + return2) - totalStake;

    return {
      stake1: Math.round(stake1 * 100) / 100,
      stake2: Math.round(stake2 * 100) / 100,
      return1: Math.round(return1 * 100) / 100,
      return2: Math.round(return2 * 100) / 100,
      totalStake: Math.round(totalStake * 100) / 100,
      profitIfOneWins: Math.round(profitIfOneWins * 100) / 100,
      profitIfBothWin: Math.round(profitIfBothWin * 100) / 100
    };
  }

  /**
   * Convert American odds to decimal
   */
  private americanToDecimal(american: number): number {
    if (american > 0) {
      return (american / 100) + 1;
    } else {
      return (100 / Math.abs(american)) + 1;
    }
  }

  /**
   * Estimate probability of hitting a middle
   */
  private estimateMiddleProbability(min: number, max: number): number {
    const range = max - min;
    // Rough estimation: wider range = higher probability
    // This is very simplified - real models use historical data
    if (range >= 3) return 25;
    if (range >= 2) return 15;
    if (range >= 1.5) return 10;
    return 5;
  }

  /**
   * Assess confidence based on bookmakers
   */
  private assessConfidence(book1: string, book2: string): 'high' | 'medium' | 'low' {
    const majorBooks = ['DraftKings', 'FanDuel', 'BetMGM', 'Caesars', 'PointsBet'];
    const book1Major = majorBooks.some(b => book1.includes(b));
    const book2Major = majorBooks.some(b => book2.includes(b));

    if (book1Major && book2Major) return 'high';
    if (book1Major || book2Major) return 'medium';
    return 'low';
  }

  /**
   * Save opportunities to storage
   */
  saveOpportunities(opportunities: ArbitrageOpportunity[]): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(opportunities));
    } catch (error) {
      console.error('Error saving arbitrage opportunities:', error);
    }
  }

  /**
   * Load opportunities from storage
   */
  loadOpportunities(): ArbitrageOpportunity[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) return [];
      return JSON.parse(stored);
    } catch (error) {
      console.error('Error loading arbitrage opportunities:', error);
      return [];
    }
  }

  /**
   * Clear all opportunities
   */
  clearOpportunities(): void {
    localStorage.removeItem(this.STORAGE_KEY);
  }
};

export const arbitrageService = new ArbitrageService();
