/**
 * Bet Tracker Service
 * Tracks user bets with P&L calculation and statistics
 */

// Type definitions
export type Bet = {
  id: string;
  userId?: string; // For when we add auth
  gameId?: string;
  sport: 'NFL' | 'NCAAF' | 'NBA' | 'NCAAB' | 'MLB' | 'NHL' | 'Other';
  gameDetails: {
    homeTeam: string;
    awayTeam: string;
    date: string;
    time?: string;
  };
  betType: 'spread' | 'moneyline' | 'total' | 'prop' | 'parlay' | 'teaser';
  selection: string; // e.g., "Chiefs -3", "Over 48.5", "Mahomes 2+ TDs"
  odds: number; // American odds (e.g., -110, +150)
  stake: number; // Amount wagered
  toWin: number; // Calculated potential win
  result: 'pending' | 'won' | 'lost' | 'push' | 'void';
  actualReturn?: number; // Actual amount returned (for pushes, etc.)
  notes?: string;
  bookmaker?: string;
  placedAt: string; // ISO timestamp
  settledAt?: string; // ISO timestamp
  tags?: string[]; // e.g., ["sharp", "model pick", "fade public"]
};;

export type BetStats = {
  totalBets: number;
  pendingBets: number;
  settledBets: number;
  wonBets: number;
  lostBets: number;
  pushBets: number;
  totalStaked: number;
  totalReturned: number;
  netProfit: number;
  roi: number; // Return on Investment %
  winRate: number; // %
  averageOdds: number;
  averageStake: number;
  biggestWin: number;
  biggestLoss: number;
  currentStreak: { type: 'win' | 'loss' | 'none'; count: number };
  longestWinStreak: number;
  longestLossStreak: number;
  // By sport
  statsBySport: Record<string, {
    bets: number;
    profit: number;
    roi: number;
    winRate: number;
  }>;
  // By bet type
  statsByBetType: Record<string, {
    bets: number;
    profit: number;
    roi: number;
    winRate: number;
  }>;
  // By month
  statsByMonth: Record<string, {
    bets: number;
    profit: number;
    roi: number;
  }>;
};;

class BetTrackerService {
  private readonly STORAGE_KEY = 'sports_bets';

  /**
   * Get all bets
   */
  getAllBets(): Bet[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) return [];
      return JSON.parse(stored);
    } catch (error) {
      console.error('Error loading bets:', error);
      return [];
    }
  }

  /**
   * Get bet by ID
   */
  getBet(id: string): Bet | null {
    const bets = this.getAllBets();
    return bets.find(bet => bet.id === id) || null;
  }

  /**
   * Add new bet
   */
  addBet(bet: Omit<Bet, 'id' | 'placedAt' | 'toWin'>): Bet {
    const bets = this.getAllBets();

    const newBet: Bet = {
      ...bet,
      id: this.generateId(),
      placedAt: new Date().toISOString(),
      toWin: this.calculateToWin(bet.stake, bet.odds),
    };

    bets.unshift(newBet); // Add to beginning
    this.saveBets(bets);

    return newBet;
  }

  /**
   * Update bet
   */
  updateBet(id: string, updates: Partial<Bet>): Bet | null {
    const bets = this.getAllBets();
    const index = bets.findIndex(bet => bet.id === id);

    if (index === -1) return null;

    // Recalculate toWin if odds or stake changed
    if (updates.odds !== undefined || updates.stake !== undefined) {
      const odds = updates.odds ?? bets[index].odds;
      const stake = updates.stake ?? bets[index].stake;
      updates.toWin = this.calculateToWin(stake, odds);
    }

    // Set settledAt if result changed from pending
    if (updates.result && updates.result !== 'pending' && bets[index].result === 'pending') {
      updates.settledAt = new Date().toISOString();
    }

    // Calculate actualReturn based on result
    if (updates.result && !updates.actualReturn) {
      updates.actualReturn = this.calculateActualReturn(
        bets[index].stake,
        bets[index].toWin,
        updates.result
      );
    }

    bets[index] = { ...bets[index], ...updates };
    this.saveBets(bets);

    return bets[index];
  }

  /**
   * Delete bet
   */
  deleteBet(id: string): boolean {
    const bets = this.getAllBets();
    const filtered = bets.filter(bet => bet.id !== id);

    if (filtered.length === bets.length) return false;

    this.saveBets(filtered);
    return true;
  }

  /**
   * Get filtered bets
   */
  getFilteredBets(filters: {
    sport?: string;
    betType?: string;
    result?: string;
    bookmaker?: string;
    startDate?: string;
    endDate?: string;
    tags?: string[];
  }): Bet[] {
    let bets = this.getAllBets();

    if (filters.sport) {
      bets = bets.filter(bet => bet.sport === filters.sport);
    }
    if (filters.betType) {
      bets = bets.filter(bet => bet.betType === filters.betType);
    }
    if (filters.result) {
      bets = bets.filter(bet => bet.result === filters.result);
    }
    if (filters.bookmaker) {
      bets = bets.filter(bet => bet.bookmaker === filters.bookmaker);
    }
    if (filters.startDate) {
      bets = bets.filter(bet => bet.placedAt >= filters.startDate!);
    }
    if (filters.endDate) {
      bets = bets.filter(bet => bet.placedAt <= filters.endDate!);
    }
    if (filters.tags && filters.tags.length > 0) {
      bets = bets.filter(bet =>
        bet.tags?.some(tag => filters.tags!.includes(tag))
      );
    }

    return bets;
  }

  /**
   * Calculate comprehensive statistics
   */
  calculateStats(bets?: Bet[]): BetStats {
    const allBets = bets || this.getAllBets();

    const pending = allBets.filter(b => b.result === 'pending');
    const settled = allBets.filter(b => b.result !== 'pending');
    const won = allBets.filter(b => b.result === 'won');
    const lost = allBets.filter(b => b.result === 'lost');
    const push = allBets.filter(b => b.result === 'push');

    const totalStaked = settled.reduce((sum, b) => sum + b.stake, 0);
    const totalReturned = settled.reduce((sum, b) => sum + (b.actualReturn || 0), 0);
    const netProfit = totalReturned - totalStaked;
    const roi = totalStaked > 0 ? (netProfit / totalStaked) * 100 : 0;
    const winRate = settled.length > 0 ? (won.length / settled.length) * 100 : 0;

    // Current streak
    const currentStreak = this.calculateCurrentStreak(allBets);
    const { longest: longestWinStreak } = this.calculateLongestStreak(allBets, 'won');
    const { longest: longestLossStreak } = this.calculateLongestStreak(allBets, 'lost');

    // By sport
    const statsBySport: Record<string, any> = {};
    const sports = Array.from(new Set(allBets.map(b => b.sport)));
    sports.forEach(sport => {
      const sportBets = settled.filter(b => b.sport === sport);
      const sportStaked = sportBets.reduce((sum, b) => sum + b.stake, 0);
      const sportReturned = sportBets.reduce((sum, b) => sum + (b.actualReturn || 0), 0);
      const sportProfit = sportReturned - sportStaked;
      const sportWon = sportBets.filter(b => b.result === 'won').length;

      statsBySport[sport] = {
        bets: sportBets.length,
        profit: sportProfit,
        roi: sportStaked > 0 ? (sportProfit / sportStaked) * 100 : 0,
        winRate: sportBets.length > 0 ? (sportWon / sportBets.length) * 100 : 0
      };
    });

    // By bet type
    const statsByBetType: Record<string, any> = {};
    const betTypes = Array.from(new Set(allBets.map(b => b.betType)));
    betTypes.forEach(betType => {
      const typeBets = settled.filter(b => b.betType === betType);
      const typeStaked = typeBets.reduce((sum, b) => sum + b.stake, 0);
      const typeReturned = typeBets.reduce((sum, b) => sum + (b.actualReturn || 0), 0);
      const typeProfit = typeReturned - typeStaked;
      const typeWon = typeBets.filter(b => b.result === 'won').length;

      statsByBetType[betType] = {
        bets: typeBets.length,
        profit: typeProfit,
        roi: typeStaked > 0 ? (typeProfit / typeStaked) * 100 : 0,
        winRate: typeBets.length > 0 ? (typeWon / typeBets.length) * 100 : 0
      };
    });

    // By month
    const statsByMonth: Record<string, any> = {};
    settled.forEach(bet => {
      const month = bet.placedAt.substring(0, 7); // YYYY-MM
      if (!statsByMonth[month]) {
        statsByMonth[month] = {
          bets: 0,
          staked: 0,
          returned: 0,
          profit: 0,
          roi: 0
        };
      }
      statsByMonth[month].bets++;
      statsByMonth[month].staked += bet.stake;
      statsByMonth[month].returned += (bet.actualReturn || 0);
    });

    // Calculate profit and ROI for each month
    Object.keys(statsByMonth).forEach(month => {
      const stats = statsByMonth[month];
      stats.profit = stats.returned - stats.staked;
      stats.roi = stats.staked > 0 ? (stats.profit / stats.staked) * 100 : 0;
    });

    return {
      totalBets: allBets.length,
      pendingBets: pending.length,
      settledBets: settled.length,
      wonBets: won.length,
      lostBets: lost.length,
      pushBets: push.length,
      totalStaked,
      totalReturned,
      netProfit,
      roi,
      winRate,
      averageOdds: settled.length > 0 ? settled.reduce((sum, b) => sum + b.odds, 0) / settled.length : 0,
      averageStake: settled.length > 0 ? totalStaked / settled.length : 0,
      biggestWin: Math.max(...settled.map(b => (b.actualReturn || 0) - b.stake), 0),
      biggestLoss: Math.min(...settled.map(b => (b.actualReturn || 0) - b.stake), 0),
      currentStreak,
      longestWinStreak,
      longestLossStreak,
      statsBySport,
      statsByBetType,
      statsByMonth
    };
  }

  /**
   * Calculate to-win amount from stake and odds
   */
  private calculateToWin(stake: number, odds: number): number {
    if (odds > 0) {
      // Positive odds (underdog)
      return stake * (odds / 100);
    } else {
      // Negative odds (favorite)
      return stake * (100 / Math.abs(odds));
    }
  }

  /**
   * Calculate actual return based on result
   */
  private calculateActualReturn(stake: number, toWin: number, result: string): number {
    switch (result) {
      case 'won':
        return stake + toWin;
      case 'lost':
        return 0;
      case 'push':
      case 'void':
        return stake;
      default:
        return 0;
    }
  }

  /**
   * Calculate current win/loss streak
   */
  private calculateCurrentStreak(bets: Bet[]): { type: 'win' | 'loss' | 'none'; count: number } {
    const settled = bets
      .filter(b => b.result === 'won' || b.result === 'lost')
      .sort((a, b) => new Date(b.settledAt || b.placedAt).getTime() - new Date(a.settledAt || a.placedAt).getTime());

    if (settled.length === 0) {
      return { type: 'none', count: 0 };
    }

    const latestResult = settled[0].result;
    let count = 0;

    for (const bet of settled) {
      if (bet.result === latestResult) {
        count++;
      } else {
        break;
      }
    }

    return {
      type: latestResult === 'won' ? 'win' : 'loss',
      count
    };
  }

  /**
   * Calculate longest streak
   */
  private calculateLongestStreak(bets: Bet[], resultType: 'won' | 'lost'): { longest: number; current: number } {
    const settled = bets
      .filter(b => b.result === 'won' || b.result === 'lost')
      .sort((a, b) => new Date(a.settledAt || a.placedAt).getTime() - new Date(b.settledAt || b.placedAt).getTime());

    let longest = 0;
    let current = 0;

    for (const bet of settled) {
      if (bet.result === resultType) {
        current++;
        longest = Math.max(longest, current);
      } else {
        current = 0;
      }
    }

    return { longest, current };
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `bet_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * Save bets to localStorage
   */
  private saveBets(bets: Bet[]): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(bets));
    } catch (error) {
      console.error('Error saving bets:', error);
    }
  }

  /**
   * Export bets to CSV
   */
  exportToCSV(): string {
    const bets = this.getAllBets();

    const headers = [
      'ID', 'Date', 'Sport', 'Game', 'Bet Type', 'Selection',
      'Odds', 'Stake', 'To Win', 'Result', 'Actual Return', 'Profit/Loss',
      'Bookmaker', 'Notes'
    ];

    const rows = bets.map(bet => [
      bet.id,
      new Date(bet.placedAt).toLocaleDateString(),
      bet.sport,
      `${bet.gameDetails.awayTeam} @ ${bet.gameDetails.homeTeam}`,
      bet.betType,
      bet.selection,
      bet.odds,
      bet.stake,
      bet.toWin.toFixed(2),
      bet.result,
      bet.actualReturn?.toFixed(2) || '',
      bet.actualReturn ? (bet.actualReturn - bet.stake).toFixed(2) : '',
      bet.bookmaker || '',
      bet.notes || ''
    ]);

    const csv = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    return csv;
  }

  /**
   * Import bets from CSV
   */
  importFromCSV(csv: string): { success: number; errors: number } {
    const lines = csv.trim().split('\n');
    const _headers = lines[0];
    let success = 0;
    let errors = 0;

    for (let i = 1; i < lines.length; i++) {
      try {
        // Parse CSV line (basic implementation)
        const values = lines[i].split(',').map(v => v.replace(/^"|"$/g, ''));

        // Extract game details from "Away @ Home" format
        const gameParts = values[3].split(' @ ');

        const bet: Omit<Bet, 'id' | 'placedAt' | 'toWin'> = {
          sport: values[2] as any,
          gameDetails: {
            homeTeam: gameParts[1] || '',
            awayTeam: gameParts[0] || '',
            date: values[1]
          },
          betType: values[4] as any,
          selection: values[5],
          odds: parseFloat(values[6]),
          stake: parseFloat(values[7]),
          result: values[9] as any,
          actualReturn: values[10] ? parseFloat(values[10]) : undefined,
          bookmaker: values[12] || undefined,
          notes: values[13] || undefined
        };

        this.addBet(bet);
        success++;
      } catch (error) {
        console.error(`Error importing line ${i}:`, error);
        errors++;
      }
    }

    return { success, errors };
  }

  /**
   * Clear all bets (with confirmation)
   */
  clearAllBets(): void {
    localStorage.removeItem(this.STORAGE_KEY);
  }
};

export const betTrackerService = new BetTrackerService();
