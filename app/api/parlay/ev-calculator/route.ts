import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { calculateExpectedValue, calculateParlayOdds } from '@/lib/services/parlay-optimizer';

export const dynamic = 'force-dynamic';

/**
 * POST - Calculate Expected Value for a parlay
 * Compares true probability vs offered odds
 */
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { legs, stake } = body;

    // Validate
    if (!Array.isArray(legs) || legs.length < 1) {
      return NextResponse.json(
        { error: 'At least 1 leg required' },
        { status: 400 }
      );
    }

    // Calculate parlay odds (combined)
    const parlayOdds = calculateParlayOdds(legs);

    // Calculate true probability
    const trueProbability = legs.reduce((prob, leg) => {
      const legProb = leg.confidence / 100;
      return prob * legProb;
    }, 1);

    // Calculate implied probability from odds
    const impliedProbability = parlayOdds > 0
      ? 100 / (parlayOdds + 100)
      : Math.abs(parlayOdds) / (Math.abs(parlayOdds) + 100);

    // Calculate EV
    const stakeAmount = stake || 10;
    const ev = calculateExpectedValue(legs, parlayOdds, stakeAmount);

    // Determine fair odds
    const fairOdds = trueProbability > 0.5
      ? -Math.round((trueProbability / (1 - trueProbability)) * 100)
      : Math.round(((1 - trueProbability) / trueProbability) * 100);

    // Calculate potential payout
    const potentialPayout = parlayOdds > 0
      ? stakeAmount * (parlayOdds / 100)
      : stakeAmount * (100 / Math.abs(parlayOdds));

    const totalPayout = stakeAmount + potentialPayout;

    return NextResponse.json({
      success: true,
      calculation: {
        legs: legs.length,
        parlayOdds: parlayOdds > 0 ? `+${parlayOdds}` : parlayOdds,
        fairOdds: fairOdds > 0 ? `+${fairOdds}` : fairOdds,
        trueProbability: Math.round(trueProbability * 1000) / 10,
        impliedProbability: Math.round(impliedProbability * 1000) / 10,
        edgePercentage: Math.round((trueProbability - impliedProbability) * 1000) / 10,
        expectedValue: Math.round(ev * 100) / 100,
        evPercentage: Math.round((ev / stakeAmount) * 1000) / 10,
        stake: stakeAmount,
        potentialPayout: Math.round(potentialPayout * 100) / 100,
        totalPayout: Math.round(totalPayout * 100) / 100,
        recommendation: ev > 0 ? 'POSITIVE EV - BET' : 'NEGATIVE EV - PASS',
      },
    });
  } catch (error) {
    console.error('[Parlay] EV Calculator error:', error);
    return NextResponse.json({ error: 'Failed to calculate EV' }, { status: 500 });
  }
}
