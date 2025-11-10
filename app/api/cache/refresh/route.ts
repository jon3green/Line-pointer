export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { fetchGames } from '@/lib/api/sports-data';
import DataAggregatorAPI from '@/lib/api/data-aggregator';
import { getAllPlayerProps } from '@/lib/api/player-props-odds';
import type { Sport } from '@/lib/types';

const LEAGUES: Sport[] = ['NFL', 'NCAAF'];
const PLAYER_PROP_SPORTS = ['nfl', 'ncaaf'] as const;

function normalizeLeague(league: Sport): 'nfl' | 'ncaaf' {
  return league.toLowerCase() as 'nfl' | 'ncaaf';
}

export async function POST(request: Request) {
  if (!process.env.CRON_SECRET) {
    return NextResponse.json(
      { success: false, error: 'CRON_SECRET not configured on server' },
      { status: 500 }
    );
  }

  const url = new URL(request.url);
  const providedSecret = url.searchParams.get('secret') ?? '';

  if (providedSecret !== process.env.CRON_SECRET) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const summary: Array<{
    league: Sport;
    games: number;
    aggregated?: number;
    propsPrimed?: boolean;
  }> = [];

  for (const league of LEAGUES) {
    try {
      const games = await fetchGames(league);
      let aggregated = 0;

      if (league === 'NFL' || league === 'NCAAF') {
        const normalized = normalizeLeague(league);
        const upcoming = games
          .filter((game) => game.status === 'scheduled')
          .slice(0, 5);

        for (const game of upcoming) {
          try {
            await DataAggregatorAPI.aggregateGameData(
              game.homeTeam.abbreviation || game.homeTeam.name,
              game.awayTeam.abbreviation || game.awayTeam.name,
              new Date(game.date),
              normalized
            );
            aggregated += 1;
          } catch (error) {
            console.warn('[cache-refresh] aggregateGameData failed', {
              league,
              gameId: game.id,
              error,
            });
          }
        }
      }

      let propsPrimed = false;
      if (PLAYER_PROP_SPORTS.includes(normalizeLeague(league) as (typeof PLAYER_PROP_SPORTS)[number])) {
        try {
          const propsResult = await getAllPlayerProps(normalizeLeague(league));
          propsPrimed = propsResult.success;
        } catch (error) {
          console.warn('[cache-refresh] getAllPlayerProps failed', { league, error });
        }
      }

      summary.push({ league, games: games.length, aggregated, propsPrimed });
    } catch (error) {
      console.error('[cache-refresh] league refresh failed', { league, error });
      summary.push({ league, games: 0 });
    }
  }

  return NextResponse.json({ success: true, refreshed: summary }, { status: 200 });
}
