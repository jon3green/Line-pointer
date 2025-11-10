import { NextResponse } from 'next/server';
import axios from 'axios';
import { cacheGameOdds } from '@/lib/cache/redis';

export const dynamic = 'force-dynamic';

const ODDS_API_KEY = process.env.NEXT_PUBLIC_ODDS_API_KEY || '9843d3412159ce8b1e28413f97f0f438';
const BASE_URL = 'https://api.the-odds-api.com/v4';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const sport = searchParams.get('sport') || 'nfl';
    
    const sportKeyMap: Record<string, string> = {
      nfl: 'americanfootball_nfl',
      ncaaf: 'americanfootball_ncaaf',
      nba: 'basketball_nba',
      mlb: 'baseball_mlb',
    };
    const sportKey = sportKeyMap[sport] || 'americanfootball_nfl';

    // Wrap the API call with caching (2 minute TTL for odds)
    const cachedData = await cacheGameOdds(sport as 'nfl' | 'ncaaf' | 'nba' | 'mlb', async () => {
      const response = await axios.get(
      `${BASE_URL}/sports/${sportKey}/odds/`,
        {
          params: {
            apiKey: ODDS_API_KEY,
            regions: 'us',
            markets: 'h2h,spreads,totals', // Moneyline, spreads, and totals
            bookmakers: 'draftkings,fanduel,betmgm,hardrock',
            oddsFormat: 'american',
          },
          timeout: 10000,
        }
      );

      // Transform to our format
      const games = response.data.map((event: any) => {
      const homeTeam = event.home_team;
      const awayTeam = event.away_team;
      
      // Get Hard Rock Bet odds if available, otherwise use first bookmaker
      const hardRockBookmaker = event.bookmakers?.find((b: any) => b.key === 'hardrock');
      const bookmaker = hardRockBookmaker || event.bookmakers?.[0];

      let odds = null;
      if (bookmaker) {
        const spreadsMarket = bookmaker.markets?.find((m: any) => m.key === 'spreads');
        const totalsMarket = bookmaker.markets?.find((m: any) => m.key === 'totals');
        const h2hMarket = bookmaker.markets?.find((m: any) => m.key === 'h2h');

        const homeSpread = spreadsMarket?.outcomes?.find((o: any) => o.name === homeTeam);
        const awaySpread = spreadsMarket?.outcomes?.find((o: any) => o.name === awayTeam);
        
        const homeML = h2hMarket?.outcomes?.find((o: any) => o.name === homeTeam);
        const awayML = h2hMarket?.outcomes?.find((o: any) => o.name === awayTeam);

        const overTotal = totalsMarket?.outcomes?.find((o: any) => o.name === 'Over');
        const underTotal = totalsMarket?.outcomes?.find((o: any) => o.name === 'Under');

        odds = {
          spread: {
            home: homeSpread?.point || 0,
            away: awaySpread?.point || 0,
            homeOdds: homeSpread?.price || -110,
            awayOdds: awaySpread?.price || -110,
          },
          moneyline: {
            home: homeML?.price || 0,
            away: awayML?.price || 0,
          },
          total: {
            over: overTotal?.price || -110,
            under: underTotal?.price || -110,
            line: overTotal?.point || 0,
          },
          source: bookmaker.title,
          lastUpdate: bookmaker.last_update,
        };
      }

      return {
        id: event.id,
        league: sport.toUpperCase(),
        date: new Date(event.commence_time),
        homeTeam: {
          name: homeTeam,
          abbreviation: homeTeam.substring(0, 3).toUpperCase(),
        },
        awayTeam: {
          name: awayTeam,
          abbreviation: awayTeam.substring(0, 3).toUpperCase(),
        },
        odds,
        status: 'scheduled',
      };
      });

      return {
        success: true,
        count: games.length,
        games,
        apiUsage: {
          used: response.headers['x-requests-used'],
          remaining: response.headers['x-requests-remaining'],
        },
      };
    });

    return NextResponse.json(cachedData);
  } catch (error) {
    console.error('Error fetching game odds:', error);
    
    if (axios.isAxiosError(error) && error.response) {
      return NextResponse.json(
        {
          success: false,
          error: error.response.data?.message || error.message,
          games: [],
        },
        { status: error.response.status }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch game odds',
        games: [],
      },
      { status: 500 }
    );
  }
}

