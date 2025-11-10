/**
 * Hard Rock Bet Odds Integration
 * 
 * Note: Hard Rock Bet doesn't have a public API. 
 * We'll use The Odds API which aggregates odds from multiple sportsbooks including Hard Rock Bet.
 * 
 * The Odds API: https://the-odds-api.com/
 * Docs: https://the-odds-api.com/liveapi/guides/v4/
 */

import axios from 'axios';

const ODDS_API_KEY = process.env.NEXT_PUBLIC_ODDS_API_KEY;
const USE_MOCK_DATA = process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true';

interface OddsAPIResponse {
  id: string;
  sport_key: string;
  sport_title: string;
  commence_time: string;
  home_team: string;
  away_team: string;
  bookmakers: Array<{
    key: string;
    title: string;
    last_update: string;
    markets: Array<{
      key: string;
      outcomes: Array<{
        name: string;
        price: number;
        point?: number;
      }>;
    }>;
  }>;
}

export const fetchHardRockOdds = async (sport: 'NFL' | 'NCAAF' = 'NFL') => {
  if (USE_MOCK_DATA || !ODDS_API_KEY) {
    return getMockHardRockOdds(sport);
  }

  try {
    const sportKey = sport === 'NFL' ? 'americanfootball_nfl' : 'americanfootball_ncaaf';
    
    const response = await axios.get<OddsAPIResponse[]>(
      `https://api.the-odds-api.com/v4/sports/${sportKey}/odds/`,
      {
        params: {
          apiKey: ODDS_API_KEY,
          regions: 'us',
          markets: 'h2h,spreads,totals',
          oddsFormat: 'american',
        },
      }
    );

    // Filter for Hard Rock Bet (if available)
    return response.data.map((game) => {
      // Try to find Hard Rock Bet odds, fallback to first available bookmaker
      const hardRockBookmaker = game.bookmakers.find(
        (b) => b.key === 'hardrock' || b.title.toLowerCase().includes('hard rock')
      );
      
      const bookmaker = hardRockBookmaker || game.bookmakers[0];

      if (!bookmaker) return null;

      // Extract markets
      const spreadMarket = bookmaker.markets.find((m) => m.key === 'spreads');
      const h2hMarket = bookmaker.markets.find((m) => m.key === 'h2h');
      const totalsMarket = bookmaker.markets.find((m) => m.key === 'totals');

      return {
        id: game.id,
        sport: sport,
        homeTeam: game.home_team,
        awayTeam: game.away_team,
        gameTime: new Date(game.commence_time),
        sportsbook: bookmaker.title,
        odds: {
          spread: spreadMarket ? {
            home: spreadMarket.outcomes.find((o) => o.name === game.home_team)?.point || 0,
            away: spreadMarket.outcomes.find((o) => o.name === game.away_team)?.point || 0,
            homeOdds: spreadMarket.outcomes.find((o) => o.name === game.home_team)?.price || -110,
            awayOdds: spreadMarket.outcomes.find((o) => o.name === game.away_team)?.price || -110,
          } : null,
          moneyline: h2hMarket ? {
            home: h2hMarket.outcomes.find((o) => o.name === game.home_team)?.price || -150,
            away: h2hMarket.outcomes.find((o) => o.name === game.away_team)?.price || 130,
          } : null,
          total: totalsMarket && totalsMarket.outcomes.length >= 2 ? {
            line: totalsMarket.outcomes[0].point || 45.5,
            over: totalsMarket.outcomes.find((o) => o.name === 'Over')?.price || -110,
            under: totalsMarket.outcomes.find((o) => o.name === 'Under')?.price || -110,
          } : null,
        },
        lastUpdate: bookmaker.last_update,
      };
    }).filter(Boolean);
  } catch (error) {
    console.error('Error fetching Hard Rock odds:', error);
    return getMockHardRockOdds(sport);
  }
};

// Mock data when API is not available
const getMockHardRockOdds = (sport: 'NFL' | 'NCAAF') => {
  const nflGames = [
    {
      id: 'mock-nfl-1',
      sport: 'NFL' as const,
      homeTeam: 'Kansas City Chiefs',
      awayTeam: 'Buffalo Bills',
      gameTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
      sportsbook: 'Hard Rock Bet',
      odds: {
        spread: { home: -2.5, away: 2.5, homeOdds: -115, awayOdds: -105 },
        moneyline: { home: -140, away: 120 },
        total: { line: 51.5, over: -110, under: -110 },
      },
      lastUpdate: new Date().toISOString(),
    },
    {
      id: 'mock-nfl-2',
      sport: 'NFL' as const,
      homeTeam: 'San Francisco 49ers',
      awayTeam: 'Dallas Cowboys',
      gameTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      sportsbook: 'Hard Rock Bet',
      odds: {
        spread: { home: -6.5, away: 6.5, homeOdds: -110, awayOdds: -110 },
        moneyline: { home: -280, away: 230 },
        total: { line: 48.5, over: -115, under: -105 },
      },
      lastUpdate: new Date().toISOString(),
    },
  ];

  const ncaafGames = [
    {
      id: 'mock-ncaaf-1',
      sport: 'NCAAF' as const,
      homeTeam: 'Georgia Bulldogs',
      awayTeam: 'Alabama Crimson Tide',
      gameTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      sportsbook: 'Hard Rock Bet',
      odds: {
        spread: { home: -3.5, away: 3.5, homeOdds: -110, awayOdds: -110 },
        moneyline: { home: -165, away: 145 },
        total: { line: 54.5, over: -108, under: -112 },
      },
      lastUpdate: new Date().toISOString(),
    },
  ];

  return sport === 'NFL' ? nflGames : ncaafGames;
};

/**
 * Fetch player props from Hard Rock Bet
 * Note: This would require a different API endpoint or scraping
 */
export const fetchPlayerProps = async (gameId: string) => {
  // Mock player props for demonstration
  return getMockPlayerProps(gameId);
};

const getMockPlayerProps = (gameId: string) => {
  return [
    {
      id: `prop-${gameId}-1`,
      gameId,
      playerName: 'Patrick Mahomes',
      team: 'Kansas City Chiefs',
      position: 'QB',
      propType: 'passing_yards',
      line: 275.5,
      overOdds: -115,
      underOdds: -105,
      sportsbook: 'Hard Rock Bet',
    },
    {
      id: `prop-${gameId}-2`,
      gameId,
      playerName: 'Patrick Mahomes',
      team: 'Kansas City Chiefs',
      position: 'QB',
      propType: 'passing_touchdowns',
      line: 2.5,
      overOdds: 130,
      underOdds: -155,
      sportsbook: 'Hard Rock Bet',
    },
    {
      id: `prop-${gameId}-3`,
      gameId,
      playerName: 'Travis Kelce',
      team: 'Kansas City Chiefs',
      position: 'TE',
      propType: 'receiving_yards',
      line: 67.5,
      overOdds: -110,
      underOdds: -110,
      sportsbook: 'Hard Rock Bet',
    },
    {
      id: `prop-${gameId}-4`,
      gameId,
      playerName: 'Josh Allen',
      team: 'Buffalo Bills',
      position: 'QB',
      propType: 'passing_yards',
      line: 265.5,
      overOdds: -105,
      underOdds: -115,
      sportsbook: 'Hard Rock Bet',
    },
  ];
};

const HardRockOddsAPI = {
  fetchHardRockOdds,
  fetchPlayerProps,
};

export default HardRockOddsAPI;

