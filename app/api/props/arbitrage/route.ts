export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getAllPlayerProps } from '@/lib/api/player-props-odds';
import LineMovementTracker from '@/lib/api/line-movement-tracker';

/**
 * GET /api/props/arbitrage
 * 
 * Detect arbitrage opportunities across sportsbooks
 * 
 * Query parameters:
 * - sport: 'nfl' | 'ncaaf' (default: 'nfl')
 * - minProfit: minimum profit percentage (default: 0.5)
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const sport = (searchParams.get('sport') || 'nfl') as 'nfl' | 'ncaaf';
    const minProfit = parseFloat(searchParams.get('minProfit') || '0.5');

    // Get all available props
    const propsData = await getAllPlayerProps(sport);

    if (!propsData.success || propsData.props.length === 0) {
      return NextResponse.json({
        success: true,
        opportunities: [],
        message: 'No props available for arbitrage analysis',
      });
    }

    // Group props by player and type to find arbitrage
    const propGroups = new Map<string, typeof propsData.props>();

    for (const prop of propsData.props) {
      const key = `${prop.playerName}-${prop.propType}-${prop.line}`;
      if (!propGroups.has(key)) {
        propGroups.set(key, []);
      }
      propGroups.get(key)!.push(prop);
    }

    // Find arbitrage opportunities
    const opportunities = [];

    for (const [key, props] of propGroups.entries()) {
      if (props.length < 2) continue; // Need at least 2 sportsbooks

      // Find best over and best under odds
      const bestOver = props.reduce((best, curr) =>
        curr.overOdds > best.overOdds ? curr : best
      );

      const bestUnder = props.reduce((best, curr) =>
        curr.underOdds > best.underOdds ? curr : best
      );

      if (bestOver.sportsbook === bestUnder.sportsbook) continue;

      // Calculate arbitrage
      const overDecimal = bestOver.overOdds > 0
        ? (bestOver.overOdds / 100) + 1
        : (100 / Math.abs(bestOver.overOdds)) + 1;

      const underDecimal = bestUnder.underOdds > 0
        ? (bestUnder.underOdds / 100) + 1
        : (100 / Math.abs(bestUnder.underOdds)) + 1;

      const totalImpliedProb = (1 / overDecimal + 1 / underDecimal);
      const profitPercent = (1 - totalImpliedProb) * 100;

      if (profitPercent >= minProfit) {
        // Calculate optimal bet sizing
        const overStake = (1 / overDecimal) / totalImpliedProb;
        const underStake = (1 / underDecimal) / totalImpliedProb;

        opportunities.push({
          player: bestOver.playerName,
          propType: bestOver.propDescription,
          line: bestOver.line,
          profitPercent: profitPercent.toFixed(2),
          overBet: {
            sportsbook: bestOver.sportsbook,
            odds: bestOver.overOdds,
            stake: (overStake * 100).toFixed(1), // % of total bankroll
          },
          underBet: {
            sportsbook: bestUnder.sportsbook,
            odds: bestUnder.underOdds,
            stake: (underStake * 100).toFixed(1), // % of total bankroll
          },
          estimatedProfit: `$${(profitPercent * 10).toFixed(2)} per $1000 wagered`,
        });
      }
    }

    // Sort by profit potential
    opportunities.sort((a, b) =>
      parseFloat(b.profitPercent) - parseFloat(a.profitPercent)
    );

    return NextResponse.json({
      success: true,
      count: opportunities.length,
      opportunities,
      disclaimer: 'Arbitrage opportunities may disappear quickly. Always verify odds before placing bets.',
    });

  } catch (error) {
    console.error('Arbitrage detection API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to detect arbitrage opportunities',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

