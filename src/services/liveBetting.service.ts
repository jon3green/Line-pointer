/**
 * Live Betting Service
 * Handles real-time in-game betting with live scores and odds updates
 */

export type LiveGame = {
  id: string;
  sport: 'NFL' | 'NCAAF' | 'NBA' | 'NCAAB' | 'MLB' | 'NHL';
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  period: string; // "Q1", "Q2", "Q3", "Q4", "OT", "Half", "Final"
  timeRemaining: string; // "12:34", "00:00"
  possession?: 'home' | 'away';
  situation?: string; // e.g., "1st & 10 at OWN 25"
  status: 'live' | 'halftime' | 'final';
  startedAt: string;

  // Live odds
  liveOdds: {
    spread: {
      home: number;
      homeOdds: number;
      away: number;
      awayOdds: number;
    };
    total: {
      over: number;
      overOdds: number;
      under: number;
      underOdds: number;
    };
    moneyline: {
      home: number;
      away: number;
    };
  };

  // Game stats
  stats?: {
    home: GameStats;
    away: GameStats;
  };

  // Momentum indicators
  momentum?: {
    team: 'home' | 'away';
    strength: 'strong' | 'moderate' | 'weak';
    description: string;
  };
};

export type GameStats = {
  totalYards: number;
  passingYards: number;
  rushingYards: number;
  turnovers: number;
  timeOfPossession: string;
  thirdDownConversions: string; // "5/10"
  redZoneEfficiency: string; // "2/3"
};

export type LiveBet = {
  id: string;
  userId?: string;
  gameId: string;
  sport: string;
  gameDetails: string;
  betType: 'spread' | 'total' | 'moneyline' | 'prop';
  selection: string;
  odds: number;
  stake: number;
  toWin: number;
  placedAt: string;
  placedInPeriod: string;
  placedScore: string;
  result?: 'pending' | 'won' | 'lost' | 'void';
  settledAt?: string;
};

export type LiveBettingAlert = {
  id: string;
  type: 'momentum_shift' | 'odds_move' | 'injury' | 'timeout' | 'scoring';
  gameId: string;
  message: string;
  priority: 'high' | 'medium' | 'low';
  timestamp: string;
};

class LiveBettingService {
  private readonly LIVE_GAMES_KEY = 'live_games';
  private readonly LIVE_BETS_KEY = 'live_bets';
  private readonly LIVE_ALERTS_KEY = 'live_alerts';
  private updateInterval: ReturnType<typeof setInterval> | null = null;

  /**
   * Get all live games
   */
  getLiveGames(): LiveGame[] {
    try {
      const stored = localStorage.getItem(this.LIVE_GAMES_KEY);
      if (!stored) return this.generateMockLiveGames();
      return JSON.parse(stored);
    } catch {
      return this.generateMockLiveGames();
    }
  }

  /**
   * Get single live game
   */
  getLiveGame(gameId: string): LiveGame | null {
    const games = this.getLiveGames();
    return games.find(g => g.id === gameId) || null;
  }

  /**
   * Start live game updates (simulates real-time)
   */
  startLiveUpdates(callback: (games: LiveGame[]) => void): void {
    // Clear existing interval
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }

    // Update every 5 seconds (in production, use WebSocket or Server-Sent Events)
    this.updateInterval = setInterval(() => {
      const games = this.getLiveGames();
      const updated = games.map(game => this.simulateGameUpdate(game));
      localStorage.setItem(this.LIVE_GAMES_KEY, JSON.stringify(updated));
      callback(updated);
    }, 5000);
  }

  /**
   * Stop live updates
   */
  stopLiveUpdates(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }

  /**
   * Place live bet
   */
  placeLiveBet(
    gameId: string,
    betType: LiveBet['betType'],
    selection: string,
    odds: number,
    stake: number
  ): { success: boolean; bet?: LiveBet; error?: string } {
    const game = this.getLiveGame(gameId);
    if (!game) {
      return { success: false, error: 'Game not found' };
    }

    if (game.status !== 'live') {
      return { success: false, error: 'Game is not live' };
    }

    const toWin = stake * (odds / 100);

    const bet: LiveBet = {
      id: `live_bet_${Date.now()}`,
      gameId,
      sport: game.sport,
      gameDetails: `${game.awayTeam} @ ${game.homeTeam}`,
      betType,
      selection,
      odds,
      stake,
      toWin,
      placedAt: new Date().toISOString(),
      placedInPeriod: game.period,
      placedScore: `${game.awayScore}-${game.homeScore}`,
      result: 'pending'
    };

    // Save bet
    const bets = this.getLiveBets();
    bets.push(bet);
    localStorage.setItem(this.LIVE_BETS_KEY, JSON.stringify(bets));

    return { success: true, bet };
  }

  /**
   * Get user's live bets
   */
  getLiveBets(): LiveBet[] {
    try {
      const stored = localStorage.getItem(this.LIVE_BETS_KEY);
      if (!stored) return [];
      return JSON.parse(stored);
    } catch {
      return [];
    }
  }

  /**
   * Get live betting alerts
   */
  getLiveAlerts(): LiveBettingAlert[] {
    try {
      const stored = localStorage.getItem(this.LIVE_ALERTS_KEY);
      if (!stored) return [];
      const alerts: LiveBettingAlert[] = JSON.parse(stored);

      // Only return alerts from last hour
      const oneHourAgo = Date.now() - 60 * 60 * 1000;
      return alerts.filter(a => new Date(a.timestamp).getTime() > oneHourAgo);
    } catch {
      return [];
    }
  }

  /**
   * Add live alert
   */
  private addAlert(
    type: LiveBettingAlert['type'],
    gameId: string,
    message: string,
    priority: LiveBettingAlert['priority']
  ): void {
    const alerts = this.getLiveAlerts();

    const alert: LiveBettingAlert = {
      id: `alert_${Date.now()}`,
      type,
      gameId,
      message,
      priority,
      timestamp: new Date().toISOString()
    };

    alerts.unshift(alert);

    // Keep only last 50 alerts
    if (alerts.length > 50) {
      alerts.splice(50);
    }

    localStorage.setItem(this.LIVE_ALERTS_KEY, JSON.stringify(alerts));
  }

  /**
   * Simulate game update (for demo purposes)
   */
  private simulateGameUpdate(game: LiveGame): LiveGame {
    if (game.status === 'final') return game;

    const random = Math.random();

    // 10% chance of scoring play
    if (random > 0.9) {
      const scoringTeam = Math.random() > 0.5 ? 'home' : 'away';
      const points = Math.random() > 0.7 ? 7 : 3; // TD or FG

      if (scoringTeam === 'home') {
        game.homeScore += points;
        this.addAlert(
          'scoring',
          game.id,
          `${game.homeTeam} scores! ${game.awayScore}-${game.homeScore}`,
          'high'
        );
      } else {
        game.awayScore += points;
        this.addAlert(
          'scoring',
          game.id,
          `${game.awayTeam} scores! ${game.awayScore}-${game.homeScore}`,
          'high'
        );
      }

      // Update odds based on score
      const scoreDiff = game.homeScore - game.awayScore;
      game.liveOdds.spread.home = game.liveOdds.spread.home + (scoreDiff > 0 ? -0.5 : 0.5);
      game.liveOdds.spread.away = -game.liveOdds.spread.home;
    }

    // 5% chance of momentum shift
    if (random > 0.95) {
      const newMomentum = Math.random() > 0.5 ? 'home' : 'away';
      game.momentum = {
        team: newMomentum,
        strength: 'strong',
        description: `${newMomentum === 'home' ? game.homeTeam : game.awayTeam} has momentum`
      };

      this.addAlert(
        'momentum_shift',
        game.id,
        `Momentum shift: ${newMomentum === 'home' ? game.homeTeam : game.awayTeam} taking control`,
        'medium'
      );
    }

    // Update time
    const [minutes, seconds] = game.timeRemaining.split(':').map(Number);
    let newMinutes = minutes;
    let newSeconds = seconds - 5;

    if (newSeconds < 0) {
      newMinutes -= 1;
      newSeconds = 55;
    }

    if (newMinutes < 0) {
      // End of period
      if (game.period === 'Q1') game.period = 'Q2';
      else if (game.period === 'Q2') {
        game.period = 'Half';
        game.status = 'halftime';
      }
      else if (game.period === 'Q3') game.period = 'Q4';
      else if (game.period === 'Q4') {
        game.period = 'Final';
        game.status = 'final';
      }

      newMinutes = 15;
      newSeconds = 0;
    }

    game.timeRemaining = `${String(newMinutes).padStart(2, '0')}:${String(newSeconds).padStart(2, '0')}`;

    return game;
  }

  /**
   * Generate mock live games for demo
   */
  private generateMockLiveGames(): LiveGame[] {
    const games: LiveGame[] = [
      {
        id: 'live_1',
        sport: 'NFL',
        homeTeam: 'Tampa Bay Buccaneers',
        awayTeam: 'Atlanta Falcons',
        homeScore: 17,
        awayScore: 14,
        period: 'Q3',
        timeRemaining: '08:42',
        possession: 'home',
        situation: '2nd & 7 at ATL 38',
        status: 'live',
        startedAt: new Date(Date.now() - 90 * 60 * 1000).toISOString(),
        liveOdds: {
          spread: {
            home: -3.5,
            homeOdds: -110,
            away: 3.5,
            awayOdds: -110
          },
          total: {
            over: 52.5,
            overOdds: -110,
            under: 52.5,
            underOdds: -110
          },
          moneyline: {
            home: -180,
            away: 155
          }
        },
        stats: {
          home: {
            totalYards: 312,
            passingYards: 234,
            rushingYards: 78,
            turnovers: 1,
            timeOfPossession: '18:23',
            thirdDownConversions: '5/9',
            redZoneEfficiency: '2/3'
          },
          away: {
            totalYards: 287,
            passingYards: 198,
            rushingYards: 89,
            turnovers: 0,
            timeOfPossession: '16:37',
            thirdDownConversions: '4/10',
            redZoneEfficiency: '2/2'
          }
        },
        momentum: {
          team: 'home',
          strength: 'moderate',
          description: 'Buccaneers controlling the game'
        }
      },
      {
        id: 'live_2',
        sport: 'NCAAF',
        homeTeam: 'Alabama',
        awayTeam: 'LSU',
        homeScore: 21,
        awayScore: 17,
        period: 'Q2',
        timeRemaining: '03:15',
        possession: 'away',
        situation: '1st & 10 at ALA 45',
        status: 'live',
        startedAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
        liveOdds: {
          spread: {
            home: -7.5,
            homeOdds: -110,
            away: 7.5,
            awayOdds: -110
          },
          total: {
            over: 61.5,
            overOdds: -110,
            under: 61.5,
            underOdds: -110
          },
          moneyline: {
            home: -320,
            away: 265
          }
        },
        stats: {
          home: {
            totalYards: 245,
            passingYards: 156,
            rushingYards: 89,
            turnovers: 0,
            timeOfPossession: '12:08',
            thirdDownConversions: '3/5',
            redZoneEfficiency: '3/3'
          },
          away: {
            totalYards: 198,
            passingYards: 142,
            rushingYards: 56,
            turnovers: 1,
            timeOfPossession: '10:37',
            thirdDownConversions: '2/7',
            redZoneEfficiency: '2/2'
          }
        },
        momentum: {
          team: 'away',
          strength: 'strong',
          description: 'LSU driving for score before half'
        }
      },
      {
        id: 'live_3',
        sport: 'NFL',
        homeTeam: 'Seattle Seahawks',
        awayTeam: 'Arizona Cardinals',
        homeScore: 24,
        awayScore: 20,
        period: 'Q4',
        timeRemaining: '11:28',
        possession: 'away',
        situation: '3rd & 2 at ARI 43',
        status: 'live',
        startedAt: new Date(Date.now() - 150 * 60 * 1000).toISOString(),
        liveOdds: {
          spread: {
            home: -2.5,
            homeOdds: -110,
            away: 2.5,
            awayOdds: -110
          },
          total: {
            over: 47.5,
            overOdds: -110,
            under: 47.5,
            underOdds: -110
          },
          moneyline: {
            home: -140,
            away: 120
          }
        },
        stats: {
          home: {
            totalYards: 368,
            passingYards: 289,
            rushingYards: 79,
            turnovers: 1,
            timeOfPossession: '25:32',
            thirdDownConversions: '7/13',
            redZoneEfficiency: '3/4'
          },
          away: {
            totalYards: 342,
            passingYards: 267,
            rushingYards: 75,
            turnovers: 2,
            timeOfPossession: '19:28',
            thirdDownConversions: '5/11',
            redZoneEfficiency: '2/3'
          }
        },
        momentum: {
          team: 'away',
          strength: 'moderate',
          description: 'Cardinals mounting comeback'
        }
      }
    ];

    localStorage.setItem(this.LIVE_GAMES_KEY, JSON.stringify(games));
    return games;
  }

  /**
   * Clear all live data (for testing)
   */
  clearAllData(): void {
    localStorage.removeItem(this.LIVE_GAMES_KEY);
    localStorage.removeItem(this.LIVE_BETS_KEY);
    localStorage.removeItem(this.LIVE_ALERTS_KEY);
    this.stopLiveUpdates();
  }
};

export const liveBettingService = new LiveBettingService();
