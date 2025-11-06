/**
 * Line Movement Service
 * Tracks and stores historical odds movements to identify sharp money
 */

// Type definitions
export type OddsSnapshot = {
  timestamp: string;
  spread: number;
  total: number;
  moneylineHome: number;
  moneylineAway: number;
  bookmaker: string;
};;

export type LineMovement = {
  gameId: string;
  sport: string;
  homeTeam: string;
  awayTeam: string;
  gameTime: string;
  snapshots: OddsSnapshot[];
  openingLine: {
    spread: number;
    total: number;
    moneylineHome: number;
    moneylineAway: number;
  };
  currentLine: {
    spread: number;
    total: number;
    moneylineHome: number;
    moneylineAway: number;
  };
  movements: {
    spreadMovement: number; // Positive = moved toward home
    totalMovement: number; // Positive = moved up
    spreadMoves: number; // Number of times spread changed
    totalMoves: number; // Number of times total changed
  };
  sharpIndicators: {
    reverseLineMovement: boolean; // Line moved opposite of public money
    steamMove: boolean; // Rapid line movement (sharp action)
    consensusAgainstPublic: boolean; // Multiple books moved same direction
  };
  publicBetting?: {
    homePercentage: number;
    awayPercentage: number;
    source: string;
  };
  createdAt: string;
  lastUpdated: string;
};;

export type LineAlert = {
  id: string;
  gameId: string;
  type: 'spread' | 'total' | 'moneyline';
  alertType: 'sharp_move' | 'steam_move' | 'rlm' | 'threshold';
  message: string;
  oldValue: number;
  newValue: number;
  change: number;
  timestamp: string;
  read: boolean;
};;

class LineMovementService {
  private readonly STORAGE_KEY = 'line_movements';
  private readonly ALERTS_KEY = 'line_alerts';

  /**
   * Get all line movements
   */
  getAllMovements(): LineMovement[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) return [];
      return JSON.parse(stored);
    } catch (error) {
      console.error('Error loading line movements:', error);
      return [];
    }
  }

  /**
   * Get line movement for a specific game
   */
  getMovement(gameId: string): LineMovement | null {
    const movements = this.getAllMovements();
    return movements.find(m => m.gameId === gameId) || null;
  }

  /**
   * Add or update line movement with new odds snapshot
   */
  recordOddsSnapshot(
    gameId: string,
    sport: string,
    homeTeam: string,
    awayTeam: string,
    gameTime: string,
    odds: {
      spread: number;
      total: number;
      moneylineHome: number;
      moneylineAway: number;
      bookmaker: string;
    }
  ): LineMovement {
    const movements = this.getAllMovements();
    let movement = movements.find(m => m.gameId === gameId);

    const snapshot: OddsSnapshot = {
      timestamp: new Date().toISOString(),
      spread: odds.spread,
      total: odds.total,
      moneylineHome: odds.moneylineHome,
      moneylineAway: odds.moneylineAway,
      bookmaker: odds.bookmaker
    };

    if (!movement) {
      // First snapshot - this becomes the opening line
      movement = {
        gameId,
        sport,
        homeTeam,
        awayTeam,
        gameTime,
        snapshots: [snapshot],
        openingLine: {
          spread: odds.spread,
          total: odds.total,
          moneylineHome: odds.moneylineHome,
          moneylineAway: odds.moneylineAway
        },
        currentLine: {
          spread: odds.spread,
          total: odds.total,
          moneylineHome: odds.moneylineHome,
          moneylineAway: odds.moneylineAway
        },
        movements: {
          spreadMovement: 0,
          totalMovement: 0,
          spreadMoves: 0,
          totalMoves: 0
        },
        sharpIndicators: {
          reverseLineMovement: false,
          steamMove: false,
          consensusAgainstPublic: false
        },
        createdAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString()
      };

      movements.push(movement);
    } else {
      // Check for significant line movement
      const previousSnapshot = movement.snapshots[movement.snapshots.length - 1];
      const spreadChanged = Math.abs(previousSnapshot.spread - odds.spread) >= 0.5;
      const totalChanged = Math.abs(previousSnapshot.total - odds.total) >= 0.5;

      // Detect steam move (rapid 1+ point movement)
      const timeSinceLastUpdate = new Date().getTime() - new Date(movement.lastUpdated).getTime();
      const isRapidMove = timeSinceLastUpdate < 5 * 60 * 1000; // 5 minutes
      const isSignificantMove = Math.abs(previousSnapshot.spread - odds.spread) >= 1;

      if (isRapidMove && isSignificantMove) {
        movement.sharpIndicators.steamMove = true;
        this.createAlert({
          gameId,
          type: 'spread',
          alertType: 'steam_move',
          message: `STEAM MOVE: ${homeTeam} vs ${awayTeam} spread moved ${Math.abs(previousSnapshot.spread - odds.spread)} points in under 5 minutes`,
          oldValue: previousSnapshot.spread,
          newValue: odds.spread,
          change: odds.spread - previousSnapshot.spread
        });
      }

      // Add snapshot
      movement.snapshots.push(snapshot);

      // Update current line
      movement.currentLine = {
        spread: odds.spread,
        total: odds.total,
        moneylineHome: odds.moneylineHome,
        moneylineAway: odds.moneylineAway
      };

      // Update movements
      movement.movements.spreadMovement = odds.spread - movement.openingLine.spread;
      movement.movements.totalMovement = odds.total - movement.openingLine.total;

      if (spreadChanged) {
        movement.movements.spreadMoves++;

        // Check for significant movement alert (1+ point)
        if (Math.abs(previousSnapshot.spread - odds.spread) >= 1) {
          this.createAlert({
            gameId,
            type: 'spread',
            alertType: 'sharp_move',
            message: `Sharp move detected: ${homeTeam} vs ${awayTeam} spread moved from ${previousSnapshot.spread} to ${odds.spread}`,
            oldValue: previousSnapshot.spread,
            newValue: odds.spread,
            change: odds.spread - previousSnapshot.spread
          });
        }
      }

      if (totalChanged) {
        movement.movements.totalMoves++;

        if (Math.abs(previousSnapshot.total - odds.total) >= 1) {
          this.createAlert({
            gameId,
            type: 'total',
            alertType: 'sharp_move',
            message: `Total moved: ${homeTeam} vs ${awayTeam} from ${previousSnapshot.total} to ${odds.total}`,
            oldValue: previousSnapshot.total,
            newValue: odds.total,
            change: odds.total - previousSnapshot.total
          });
        }
      }

      movement.lastUpdated = new Date().toISOString();
    }

    this.saveMovements(movements);
    return movement;
  }

  /**
   * Add public betting percentages
   */
  addPublicBetting(
    gameId: string,
    homePercentage: number,
    awayPercentage: number,
    source: string = 'Manual'
  ): void {
    const movements = this.getAllMovements();
    const movement = movements.find(m => m.gameId === gameId);

    if (movement) {
      movement.publicBetting = {
        homePercentage,
        awayPercentage,
        source
      };

      // Check for Reverse Line Movement
      if (homePercentage > 65 && movement.movements.spreadMovement > 0) {
        // Public heavily on home, but line moved toward away
        movement.sharpIndicators.reverseLineMovement = true;
        this.createAlert({
          gameId,
          type: 'spread',
          alertType: 'rlm',
          message: `REVERSE LINE MOVEMENT: ${homePercentage}% of public on ${movement.homeTeam}, but line moved against them`,
          oldValue: movement.openingLine.spread,
          newValue: movement.currentLine.spread,
          change: movement.movements.spreadMovement
        });
      } else if (awayPercentage > 65 && movement.movements.spreadMovement < 0) {
        // Public heavily on away, but line moved toward home
        movement.sharpIndicators.reverseLineMovement = true;
        this.createAlert({
          gameId,
          type: 'spread',
          alertType: 'rlm',
          message: `REVERSE LINE MOVEMENT: ${awayPercentage}% of public on ${movement.awayTeam}, but line moved against them`,
          oldValue: movement.openingLine.spread,
          newValue: movement.currentLine.spread,
          change: movement.movements.spreadMovement
        });
      }

      this.saveMovements(movements);
    }
  }

  /**
   * Get line movement chart data
   */
  getChartData(gameId: string, dataType: 'spread' | 'total' | 'moneyline' = 'spread') {
    const movement = this.getMovement(gameId);
    if (!movement) return null;

    const labels = movement.snapshots.map(s =>
      new Date(s.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    );

    let data: number[];
    let label: string;

    switch (dataType) {
      case 'spread':
        data = movement.snapshots.map(s => s.spread);
        label = 'Spread';
        break;
      case 'total':
        data = movement.snapshots.map(s => s.total);
        label = 'Total';
        break;
      case 'moneyline':
        data = movement.snapshots.map(s => s.moneylineHome);
        label = 'Moneyline (Home)';
        break;
    }

    return {
      labels,
      datasets: [{
        label,
        data,
        borderColor: dataType === 'spread' ? 'rgb(59, 130, 246)' :
                     dataType === 'total' ? 'rgb(168, 85, 247)' :
                     'rgb(34, 197, 94)',
        backgroundColor: dataType === 'spread' ? 'rgba(59, 130, 246, 0.1)' :
                        dataType === 'total' ? 'rgba(168, 85, 247, 0.1)' :
                        'rgba(34, 197, 94, 0.1)',
        tension: 0.1,
        fill: true
      }],
      openingLine: dataType === 'spread' ? movement.openingLine.spread :
                   dataType === 'total' ? movement.openingLine.total :
                   movement.openingLine.moneylineHome,
      currentLine: dataType === 'spread' ? movement.currentLine.spread :
                   dataType === 'total' ? movement.currentLine.total :
                   movement.currentLine.moneylineHome,
      movement: dataType === 'spread' ? movement.movements.spreadMovement :
                dataType === 'total' ? movement.movements.totalMovement :
                movement.currentLine.moneylineHome - movement.openingLine.moneylineHome
    };
  }

  /**
   * Get games with significant line movement
   */
  getGamesWithSignificantMovement(threshold: number = 1): LineMovement[] {
    const movements = this.getAllMovements();
    return movements.filter(m =>
      Math.abs(m.movements.spreadMovement) >= threshold ||
      Math.abs(m.movements.totalMovement) >= threshold
    );
  }

  /**
   * Get games with sharp indicators
   */
  getSharpGames(): LineMovement[] {
    const movements = this.getAllMovements();
    return movements.filter(m =>
      m.sharpIndicators.reverseLineMovement ||
      m.sharpIndicators.steamMove ||
      m.sharpIndicators.consensusAgainstPublic
    );
  }

  /**
   * Create alert
   */
  private createAlert(alertData: Omit<LineAlert, 'id' | 'timestamp' | 'read'>): LineAlert {
    const alerts = this.getAlerts();

    const alert: LineAlert = {
      ...alertData,
      id: `alert_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      timestamp: new Date().toISOString(),
      read: false
    };

    alerts.unshift(alert);

    // Keep only last 100 alerts
    if (alerts.length > 100) {
      alerts.splice(100);
    }

    this.saveAlerts(alerts);
    return alert;
  }

  /**
   * Get all alerts
   */
  getAlerts(unreadOnly: boolean = false): LineAlert[] {
    try {
      const stored = localStorage.getItem(this.ALERTS_KEY);
      if (!stored) return [];
      const alerts: LineAlert[] = JSON.parse(stored);
      return unreadOnly ? alerts.filter(a => !a.read) : alerts;
    } catch (error) {
      console.error('Error loading alerts:', error);
      return [];
    }
  }

  /**
   * Mark alert as read
   */
  markAlertRead(alertId: string): void {
    const alerts = this.getAlerts();
    const alert = alerts.find(a => a.id === alertId);
    if (alert) {
      alert.read = true;
      this.saveAlerts(alerts);
    }
  }

  /**
   * Mark all alerts as read
   */
  markAllAlertsRead(): void {
    const alerts = this.getAlerts();
    alerts.forEach(a => a.read = true);
    this.saveAlerts(alerts);
  }

  /**
   * Delete alert
   */
  deleteAlert(alertId: string): void {
    const alerts = this.getAlerts();
    const filtered = alerts.filter(a => a.id !== alertId);
    this.saveAlerts(filtered);
  }

  /**
   * Clear old movements (games that have passed)
   */
  clearOldMovements(): void {
    const movements = this.getAllMovements();
    const now = new Date();
    const filtered = movements.filter(m => {
      const gameTime = new Date(m.gameTime);
      const hoursSinceGame = (now.getTime() - gameTime.getTime()) / (1000 * 60 * 60);
      return hoursSinceGame < 48; // Keep movements for 48 hours after game
    });

    this.saveMovements(filtered);
  }

  /**
   * Export line movements to CSV
   */
  exportToCSV(gameId?: string): string {
    const movements = gameId
      ? [this.getMovement(gameId)].filter(Boolean) as LineMovement[]
      : this.getAllMovements();

    const headers = [
      'Game ID', 'Sport', 'Teams', 'Game Time',
      'Opening Spread', 'Current Spread', 'Spread Movement',
      'Opening Total', 'Current Total', 'Total Movement',
      'Spread Moves', 'Total Moves',
      'Steam Move', 'RLM', 'Public % Home', 'Public % Away'
    ];

    const rows = movements.map(m => [
      m.gameId,
      m.sport,
      `${m.awayTeam} @ ${m.homeTeam}`,
      new Date(m.gameTime).toLocaleString(),
      m.openingLine.spread,
      m.currentLine.spread,
      m.movements.spreadMovement,
      m.openingLine.total,
      m.currentLine.total,
      m.movements.totalMovement,
      m.movements.spreadMoves,
      m.movements.totalMoves,
      m.sharpIndicators.steamMove ? 'Yes' : 'No',
      m.sharpIndicators.reverseLineMovement ? 'Yes' : 'No',
      m.publicBetting?.homePercentage || '',
      m.publicBetting?.awayPercentage || ''
    ]);

    const csv = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    return csv;
  }

  /**
   * Save movements to localStorage
   */
  private saveMovements(movements: LineMovement[]): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(movements));
    } catch (error) {
      console.error('Error saving movements:', error);
    }
  }

  /**
   * Save alerts to localStorage
   */
  private saveAlerts(alerts: LineAlert[]): void {
    try {
      localStorage.setItem(this.ALERTS_KEY, JSON.stringify(alerts));
    } catch (error) {
      console.error('Error saving alerts:', error);
    }
  }

  /**
   * Clear all data
   */
  clearAllData(): void {
    localStorage.removeItem(this.STORAGE_KEY);
    localStorage.removeItem(this.ALERTS_KEY);
  }
};

export const lineMovementService = new LineMovementService();
