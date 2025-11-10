import { NextResponse } from 'next/server';
import { fetchGames } from '@/lib/api/sports-data';
import { savePredictions } from '@/lib/services/prediction-tracker';
import type { Sport } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const leagueParam = searchParams.get('league');
    const normalized = leagueParam?.trim().toUpperCase();
    const supportedLeagues: Sport[] = ['NFL', 'NCAAF'];
    const league = supportedLeagues.includes(normalized as Sport)
      ? (normalized as Sport)
      : undefined;

    const games = await fetchGames(league);

    // Auto-save predictions for tracking (async, don't block response)
    savePredictions(games).catch((err) => {
      console.error('Error auto-saving predictions:', err);
    });

    return NextResponse.json({ games, success: true });
  } catch (error) {
    console.error('Error fetching games:', error);
    return NextResponse.json(
      { error: 'Failed to fetch games', success: false },
      { status: 500 }
    );
  }
}

