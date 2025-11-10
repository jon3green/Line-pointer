import { NextResponse } from 'next/server';
import { fetchGames } from '@/lib/api/sports-data';
import { generateOptimalParlays, getRecommendedStake } from '@/lib/ml/parlay-optimizer';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const minLegs = Number(searchParams.get('minLegs')) || 3;
    const maxLegs = Number(searchParams.get('maxLegs')) || 5;
    const stake = Number(searchParams.get('stake')) || 100;
    const bankroll = Number(searchParams.get('bankroll')) || 1000;

    // Fetch all available games
    const games = await fetchGames();

    // Generate optimal parlays
    const parlays = generateOptimalParlays(games, stake, minLegs, maxLegs);

    // Add recommended stakes
    const parlaysWithStakes = parlays.map((parlay) => ({
      ...parlay,
      recommendedStakes: {
        conservative: getRecommendedStake(parlay, bankroll, 'conservative'),
        moderate: getRecommendedStake(parlay, bankroll, 'moderate'),
        aggressive: getRecommendedStake(parlay, bankroll, 'aggressive'),
      },
    }));

    return NextResponse.json({
      parlays: parlaysWithStakes,
      totalGenerated: parlaysWithStakes.length,
      gamesAnalyzed: games.length,
      success: true,
    });
  } catch (error) {
    console.error('Error generating optimal parlays:', error);
    return NextResponse.json(
      { error: 'Failed to generate optimal parlays', success: false },
      { status: 500 }
    );
  }
}
