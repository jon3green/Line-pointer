/**
 * Line Movement Tracking Service
 * Tracks odds changes over time for arbitrage and value detection
 */

import { kv } from '@vercel/kv';
import axios from 'axios';

export interface LineMovement {
  id: string;
  type: 'game_line' | 'player_prop';
  gameId?: string;
  playerId?: string;
  propType?: string;
  timestamp: Date;
  sportsbook: string;
  // For game lines
  spread?: number;
  spreadOdds?: number;
  moneyline?: number;
  total?: number;
  totalOdds?: number;
  // For player props
  propLine?: number;
  overOdds?: number;
  underOdds?: number;
}

export interface LineHistory {
  entityId: string;
  movements: LineMovement[];
  currentLine: LineMovement;
  openingLine: LineMovement;
  movement: {
    direction: 'up' | 'down' | 'stable';
    amount: number;
    percentage: number;
  };
  sharpAction: boolean; // Indicates professional money
  steamMove: boolean; // Rapid movement across books
}

/**
 * Record a line movement
 */
export async function recordLineMovement(movement: LineMovement): Promise<void> {
  const key = `line_movement:${movement.type}:${movement.gameId || movement.playerId}:${movement.propType || 'main'}`;
  
  try {
    // Get existing movements
    const existing = await kv.get<LineMovement[]>(key) || [];
    
    // Add new movement
    existing.push(movement);
    
    // Keep only last 100 movements per line
    const trimmed = existing.slice(-100);
    
    // Store with 7 day expiry
    await kv.set(key, trimmed, { ex: 7 * 24 * 60 * 60 });
    
    // Check for steam move (rapid movement across multiple books)
    await detectSteamMove(movement, trimmed);
  } catch (error) {
    console.error('Error recording line movement:', error);
  }
}

/**
 * Get line history for a specific entity
 */
export async function getLineHistory(
  type: 'game_line' | 'player_prop',
  entityId: string,
  propType?: string
): Promise<LineHistory | null> {
  const key = `line_movement:${type}:${entityId}:${propType || 'main'}`;
  
  try {
    const movements = await kv.get<LineMovement[]>(key);
    
    if (!movements || movements.length === 0) {
      return null;
    }
    
    const currentLine = movements[movements.length - 1];
    const openingLine = movements[0];
    
    // Calculate movement
    let amount = 0;
    let direction: 'up' | 'down' | 'stable' = 'stable';
    
    if (type === 'game_line' && currentLine.spread && openingLine.spread) {
      amount = currentLine.spread - openingLine.spread;
      direction = amount > 0.5 ? 'up' : amount < -0.5 ? 'down' : 'stable';
    } else if (type === 'player_prop' && currentLine.propLine && openingLine.propLine) {
      amount = currentLine.propLine - openingLine.propLine;
      direction = amount > 0.5 ? 'up' : amount < -0.5 ? 'down' : 'stable';
    }
    
    const percentage = openingLine.propLine ? (amount / openingLine.propLine) * 100 : 0;
    
    // Detect sharp action (reverse line movement)
    const sharpAction = detectSharpAction(movements);
    const steamMove = await checkSteamMove(entityId, type);
    
    return {
      entityId,
      movements,
      currentLine,
      openingLine,
      movement: {
        direction,
        amount,
        percentage,
      },
      sharpAction,
      steamMove,
    };
  } catch (error) {
    console.error('Error getting line history:', error);
    return null;
  }
}

/**
 * Detect sharp action (line moves against public betting)
 */
function detectSharpAction(movements: LineMovement[]): boolean {
  if (movements.length < 5) return false;
  
  // Look for reverse line movement
  // (line moves opposite to what public would expect)
  const recent = movements.slice(-5);
  let reverseMoves = 0;
  
  for (let i = 1; i < recent.length; i++) {
    const prev = recent[i - 1];
    const curr = recent[i];
    
    // Check if line moved but odds got worse for popular side
    if (prev.propLine && curr.propLine) {
      const lineMove = curr.propLine - prev.propLine;
      const oddsMove = (curr.overOdds || 0) - (prev.overOdds || 0);
      
      // If line moved up but over odds got worse (more negative)
      if (lineMove > 0 && oddsMove < 0) reverseMoves++;
      // If line moved down but under odds got worse
      if (lineMove < 0 && oddsMove > 0) reverseMoves++;
    }
  }
  
  return reverseMoves >= 2;
}

/**
 * Detect steam move (rapid coordinated movement)
 */
async function detectSteamMove(
  movement: LineMovement,
  history: LineMovement[]
): Promise<void> {
  // Steam move criteria:
  // 1. Line moves significantly (>1 point) in short time (<15 min)
  // 2. Multiple sportsbooks move together
  
  const recentWindow = 15 * 60 * 1000; // 15 minutes
  const now = new Date(movement.timestamp).getTime();
  
  const recentMoves = history.filter(m => {
    const moveTime = new Date(m.timestamp).getTime();
    return now - moveTime < recentWindow;
  });
  
  if (recentMoves.length >= 3) {
    // Multiple books moved recently
    const uniqueBooks = new Set(recentMoves.map(m => m.sportsbook));
    
    if (uniqueBooks.size >= 2) {
      // Flag as steam move
      const steamKey = `steam_move:${movement.gameId || movement.playerId}`;
      await kv.set(steamKey, true, { ex: 60 * 60 }); // 1 hour expiry
    }
  }
}

/**
 * Check if there's a steam move for an entity
 */
async function checkSteamMove(
  entityId: string,
  type: 'game_line' | 'player_prop'
): Promise<boolean> {
  const steamKey = `steam_move:${entityId}`;
  const hasSteam = await kv.get(steamKey);
  return !!hasSteam;
}

/**
 * Track odds for a game or prop
 */
export async function trackOdds(
  gameId: string,
  sportsbook: string,
  odds: {
    spread?: number;
    spreadOdds?: number;
    moneyline?: number;
    total?: number;
    totalOdds?: number;
  }
): Promise<void> {
  const movement: LineMovement = {
    id: `${gameId}-${sportsbook}-${Date.now()}`,
    type: 'game_line',
    gameId,
    timestamp: new Date(),
    sportsbook,
    ...odds,
  };
  
  await recordLineMovement(movement);
}

/**
 * Track player prop line
 */
export async function trackPropLine(
  playerId: string,
  propType: string,
  sportsbook: string,
  line: number,
  overOdds: number,
  underOdds: number
): Promise<void> {
  const movement: LineMovement = {
    id: `${playerId}-${propType}-${sportsbook}-${Date.now()}`,
    type: 'player_prop',
    playerId,
    propType,
    timestamp: new Date(),
    sportsbook,
    propLine: line,
    overOdds,
    underOdds,
  };
  
  await recordLineMovement(movement);
}

/**
 * Get trending props (props with significant movement)
 */
export async function getTrendingProps(sport: 'nfl' | 'ncaaf'): Promise<LineHistory[]> {
  // This would scan recent props and return those with significant movement
  // For now, return empty array as placeholder
  return [];
}

/**
 * Detect arbitrage opportunities
 */
export async function detectArbitrage(
  entityId: string,
  type: 'game_line' | 'player_prop'
): Promise<{
  hasArbitrage: boolean;
  profit: number;
  books: { book: string; side: string; odds: number }[];
} | null> {
  const history = await getLineHistory(type, entityId);
  
  if (!history || history.movements.length < 2) {
    return null;
  }
  
  // Get latest odds from each sportsbook
  const latestByBook = new Map<string, LineMovement>();
  
  for (const movement of history.movements.reverse()) {
    if (!latestByBook.has(movement.sportsbook)) {
      latestByBook.set(movement.sportsbook, movement);
    }
  }
  
  const movements = Array.from(latestByBook.values());
  
  if (movements.length < 2) {
    return null;
  }
  
  // For player props, check if we can bet both sides profitably
  if (type === 'player_prop') {
    const bestOver = movements.reduce((best, curr) => 
      (curr.overOdds || 0) > (best.overOdds || 0) ? curr : best
    );
    
    const bestUnder = movements.reduce((best, curr) =>
      (curr.underOdds || 0) > (best.underOdds || 0) ? curr : best
    );
    
    if (bestOver.sportsbook !== bestUnder.sportsbook) {
      // Calculate if profitable
      const overDecimal = oddsToDecimal(bestOver.overOdds || 0);
      const underDecimal = oddsToDecimal(bestUnder.underOdds || 0);
      
      const profit = (1 / overDecimal + 1 / underDecimal - 1) * -100;
      
      if (profit > 0) {
        return {
          hasArbitrage: true,
          profit,
          books: [
            { book: bestOver.sportsbook, side: 'over', odds: bestOver.overOdds || 0 },
            { book: bestUnder.sportsbook, side: 'under', odds: bestUnder.underOdds || 0 },
          ],
        };
      }
    }
  }
  
  return { hasArbitrage: false, profit: 0, books: [] };
}

function oddsToDecimal(americanOdds: number): number {
  if (americanOdds > 0) {
    return (americanOdds / 100) + 1;
  } else {
    return (100 / Math.abs(americanOdds)) + 1;
  }
}

const LineMovementTrackerAPI = {
  recordLineMovement,
  getLineHistory,
  trackOdds,
  trackPropLine,
  getTrendingProps,
  detectArbitrage,
};

export default LineMovementTrackerAPI;

