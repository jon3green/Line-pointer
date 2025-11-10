/**
 * Bet Timing Recommendations Engine
 *
 * Analyzes historical line movements to provide optimal bet timing advice
 * Based on sharp money patterns, volatility, and line movement trends
 */

import { prisma } from '@/lib/prisma';

export interface TimingRecommendation {
  action: 'bet_now' | 'wait' | 'avoid';
  confidence: 'low' | 'medium' | 'high';
  reasoning: string[];
  optimalWindow: string;
  riskLevel: 'low' | 'medium' | 'high';
  expectedMovement: {
    direction: 'up' | 'down' | 'stable';
    magnitude: number; // in points
  };
  indicators: {
    sharpMoney: boolean;
    steamMove: boolean;
    highVolatility: boolean;
    favorableMovement: boolean;
  };
}

/**
 * Get bet timing recommendation for a game
 */
export async function getBetTimingRecommendation(
  gameId: string,
  externalGameId?: string
): Promise<TimingRecommendation | null> {
  try {
    // Get odds history for this game
    const oddsHistory = await prisma.oddsHistory.findMany({
      where: {
        OR: [
          { gameId: gameId },
          ...(externalGameId ? [{ externalGameId: externalGameId }] : []),
        ],
      },
      orderBy: { timestamp: 'asc' },
    });

    if (oddsHistory.length === 0) {
      return null;
    }

    const firstOdds = oddsHistory[0];
    const latestOdds = oddsHistory[oddsHistory.length - 1];
    const gameTime = new Date(latestOdds.gameTime);
    const now = new Date();
    const hoursUntilGame = (gameTime.getTime() - now.getTime()) / (1000 * 60 * 60);

    // Analyze line movement patterns
    const analysis = analyzeLineMovement(oddsHistory);

    // Build recommendation
    const recommendation: TimingRecommendation = {
      action: 'wait',
      confidence: 'medium',
      reasoning: [],
      optimalWindow: getOptimalWindow(hoursUntilGame),
      riskLevel: 'medium',
      expectedMovement: {
        direction: 'stable',
        magnitude: 0,
      },
      indicators: {
        sharpMoney: analysis.hasSharpMoney,
        steamMove: analysis.hasSteamMove,
        highVolatility: analysis.volatility > 1.5,
        favorableMovement: false,
      },
    };

    // Decision logic
    const reasons: string[] = [];

    // 1. Check for steam moves (urgent action)
    if (analysis.hasSteamMove) {
      recommendation.action = 'bet_now';
      recommendation.confidence = 'high';
      recommendation.riskLevel = 'low';
      reasons.push('🔥 Steam move detected - sharp money is moving the line rapidly');
      reasons.push('Act quickly to get current odds before further movement');
      recommendation.indicators.favorableMovement = true;
    }

    // 2. Check for sharp money indicators
    if (analysis.hasSharpMoney && !analysis.hasSteamMove) {
      recommendation.action = 'bet_now';
      recommendation.confidence = 'high';
      recommendation.riskLevel = 'low';
      reasons.push('💡 Sharp money detected on this game');
      reasons.push('Professional bettors are taking a position');
      recommendation.indicators.favorableMovement = true;
    }

    // 3. High volatility - wait for stability
    if (analysis.volatility > 1.5 && !analysis.hasSteamMove) {
      recommendation.action = 'wait';
      recommendation.confidence = 'medium';
      recommendation.riskLevel = 'high';
      reasons.push('⚠️ High line volatility detected');
      reasons.push('Wait for the line to stabilize before betting');
      recommendation.expectedMovement = {
        direction: analysis.trendDirection,
        magnitude: Math.abs(analysis.recentMovement),
      };
    }

    // 4. Significant reverse line movement
    if (analysis.hasReverseLineMovement) {
      recommendation.action = 'bet_now';
      recommendation.confidence = 'medium';
      recommendation.riskLevel = 'medium';
      reasons.push('🔄 Reverse line movement detected');
      reasons.push('Line moving against public money - potential value');
    }

    // 5. Game is very close (< 3 hours)
    if (hoursUntilGame < 3 && hoursUntilGame > 0) {
      if (recommendation.action === 'wait') {
        recommendation.action = 'bet_now';
        recommendation.confidence = 'medium';
      }
      reasons.push('⏰ Game starts in less than 3 hours');
      reasons.push('Bet soon to avoid last-minute sharp action');
    }

    // 6. Game has passed
    if (hoursUntilGame <= 0) {
      recommendation.action = 'avoid';
      recommendation.confidence = 'high';
      recommendation.riskLevel = 'high';
      reasons.push('🚫 Game has already started or completed');
      reasons.push('Betting is closed');
    }

    // 7. Early week lines (> 72 hours out)
    if (hoursUntilGame > 72 && !analysis.hasSharpMoney) {
      recommendation.action = 'wait';
      recommendation.confidence = 'medium';
      recommendation.riskLevel = 'low';
      reasons.push('📅 Still early in the week');
      reasons.push('Lines typically sharpen closer to game time');
      reasons.push('Wait for sharp money and injury news');
    }

    // 8. Stable line with no indicators
    if (
      analysis.volatility < 0.5 &&
      !analysis.hasSharpMoney &&
      !analysis.hasSteamMove &&
      hoursUntilGame > 6 &&
      hoursUntilGame < 48
    ) {
      recommendation.action = 'bet_now';
      recommendation.confidence = 'medium';
      recommendation.riskLevel = 'low';
      reasons.push('✅ Line is stable and optimal timing window');
      reasons.push('Good opportunity to lock in current odds');
    }

    // 9. Favorable line movement for our position
    if (analysis.totalMovement > 1 && hoursUntilGame > 12) {
      recommendation.expectedMovement = {
        direction: analysis.trendDirection,
        magnitude: Math.abs(analysis.totalMovement),
      };
      reasons.push(
        `📊 Line has moved ${Math.abs(analysis.totalMovement).toFixed(1)} points`
      );
      reasons.push('Consider if current price offers value');
    }

    recommendation.reasoning = reasons.length > 0 ? reasons : [
      'ℹ️ No strong indicators detected',
      'Monitor line movement and wait for a better opportunity',
    ];

    return recommendation;
  } catch (error) {
    console.error('[BetTiming] Error generating recommendation:', error);
    return null;
  }
}

/**
 * Analyze line movement patterns
 */
function analyzeLineMovement(oddsHistory: any[]) {
  if (oddsHistory.length === 0) {
    return {
      totalMovement: 0,
      recentMovement: 0,
      volatility: 0,
      hasSharpMoney: false,
      hasSteamMove: false,
      hasReverseLineMovement: false,
      trendDirection: 'stable' as 'up' | 'down' | 'stable',
    };
  }

  const firstOdds = oddsHistory[0];
  const latestOdds = oddsHistory[oddsHistory.length - 1];

  // Calculate total movement
  const totalMovement =
    firstOdds.spread && latestOdds.spread
      ? latestOdds.spread - firstOdds.spread
      : 0;

  // Calculate recent movement (last 25% of snapshots)
  const recentCount = Math.max(1, Math.floor(oddsHistory.length * 0.25));
  const recentOdds = oddsHistory.slice(-recentCount);
  const recentStart = recentOdds[0];
  const recentMovement =
    recentStart.spread && latestOdds.spread
      ? latestOdds.spread - recentStart.spread
      : 0;

  // Calculate volatility (standard deviation of movements)
  const movements: number[] = [];
  for (let i = 1; i < oddsHistory.length; i++) {
    if (oddsHistory[i].spread && oddsHistory[i - 1].spread) {
      movements.push(oddsHistory[i].spread - oddsHistory[i - 1].spread);
    }
  }

  const volatility =
    movements.length > 0
      ? Math.sqrt(
          movements.reduce((sum, m) => sum + m * m, 0) / movements.length
        )
      : 0;

  // Check for indicators
  const hasSharpMoney = oddsHistory.some(o => o.sharpMoney);
  const hasSteamMove = oddsHistory.some(o => o.isSteamMove);
  const hasReverseLineMovement = oddsHistory.some(o => o.isRLM);

  // Determine trend direction
  let trendDirection: 'up' | 'down' | 'stable' = 'stable';
  if (totalMovement > 0.5) trendDirection = 'up';
  else if (totalMovement < -0.5) trendDirection = 'down';

  return {
    totalMovement,
    recentMovement,
    volatility,
    hasSharpMoney,
    hasSteamMove,
    hasReverseLineMovement,
    trendDirection,
  };
}

/**
 * Get optimal betting window based on hours until game
 */
function getOptimalWindow(hoursUntilGame: number): string {
  if (hoursUntilGame <= 0) {
    return 'Game has started';
  } else if (hoursUntilGame < 3) {
    return 'Bet immediately (< 3 hours)';
  } else if (hoursUntilGame < 12) {
    return 'Optimal window (3-12 hours)';
  } else if (hoursUntilGame < 48) {
    return 'Good window (12-48 hours)';
  } else if (hoursUntilGame < 72) {
    return 'Early window (2-3 days)';
  } else {
    return 'Very early (> 3 days) - wait for sharper lines';
  }
}

/**
 * Get historical timing patterns for a sport
 * Helps understand when sharp money typically comes in
 */
export async function getHistoricalTimingPatterns(sport?: string) {
  try {
    const where: any = {};
    if (sport) where.sport = sport;

    // Get all games with sharp money indicators
    const sharpGames = await prisma.oddsHistory.findMany({
      where: {
        ...where,
        sharpMoney: true,
      },
      select: {
        gameTime: true,
        timestamp: true,
        sharpMoney: true,
      },
    });

    // Calculate hours before game that sharp money came in
    const timingDistribution: Record<string, number> = {
      '0-3h': 0,
      '3-12h': 0,
      '12-24h': 0,
      '24-48h': 0,
      '48h+': 0,
    };

    sharpGames.forEach(game => {
      const hoursBeforeGame =
        (new Date(game.gameTime).getTime() - new Date(game.timestamp).getTime()) /
        (1000 * 60 * 60);

      if (hoursBeforeGame < 3) timingDistribution['0-3h']++;
      else if (hoursBeforeGame < 12) timingDistribution['3-12h']++;
      else if (hoursBeforeGame < 24) timingDistribution['12-24h']++;
      else if (hoursBeforeGame < 48) timingDistribution['24-48h']++;
      else timingDistribution['48h+']++;
    });

    return {
      totalSharpGames: sharpGames.length,
      timingDistribution,
      recommendation: getBestTimingWindow(timingDistribution),
    };
  } catch (error) {
    console.error('[BetTiming] Error fetching historical patterns:', error);
    return null;
  }
}

/**
 * Determine best timing window based on historical patterns
 */
function getBestTimingWindow(distribution: Record<string, number>): string {
  const entries = Object.entries(distribution);
  const max = Math.max(...entries.map(([, count]) => count));
  const bestWindow = entries.find(([, count]) => count === max)?.[0];

  return bestWindow || '12-24h';
}
