import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@vercel/kv', () => {
  const store = new Map<string, unknown>();
  return {
    kv: {
      __store: store,
      async get<T>(key: string): Promise<T | null> {
        return (store.get(key) as T) ?? null;
      },
      async set(key: string, value: unknown) {
        store.set(key, value);
      },
      async del(key: string) {
        store.delete(key);
      },
    },
  };
});

const scoreboardResponse = {
  events: [
    {
      id: '401772999',
      date: '2025-11-09T18:00Z',
      status: {
        type: {
          state: 'pre',
        },
      },
      competitions: [
        {
          id: 'competition-1',
          date: '2025-11-09T18:00Z',
          status: {
            type: {
              state: 'pre',
            },
          },
          competitors: [
            {
              homeAway: 'home',
              score: '',
              team: {
                id: 'home-team',
                displayName: 'Home Heroes',
                name: 'Home Heroes',
                abbreviation: 'HOM',
                logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/hom.png',
              },
              records: [
                {
                  type: 'total',
                  summary: '4-1',
                },
              ],
            },
            {
              homeAway: 'away',
              score: '',
              team: {
                id: 'away-team',
                displayName: 'Road Warriors',
                name: 'Road Warriors',
                abbreviation: 'ROA',
                logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/roa.png',
              },
              records: [
                {
                  type: 'total',
                  summary: '3-2',
                },
              ],
            },
          ],
          odds: [
            {
              provider: {
                name: 'ESPN BET',
              },
              moneyline: {
                home: {
                  close: {
                    odds: '-125',
                  },
                },
                away: {
                  close: {
                    odds: '+105',
                  },
                },
              },
              pointSpread: {
                home: {
                  close: {
                    line: '-3.5',
                    odds: '-110',
                  },
                },
                away: {
                  close: {
                    line: '+3.5',
                    odds: '-110',
                  },
                },
              },
              total: {
                over: {
                  close: {
                    line: 'o45.5',
                    odds: '-110',
                  },
                },
                under: {
                  close: {
                    line: 'u45.5',
                    odds: '-110',
                  },
                },
              },
              featuredBets: [
                {
                  id: 'parlay-1',
                  displayName: 'Sunday Super Boost',
                  type: 'PARLAY',
                  odds: '+450',
                  startTime: '2025-11-09T18:00Z',
                  url: 'https://espnbet.app.link/parlay',
                  legs: [
                    {
                      selectionText: 'Home Heroes -3.5',
                      marketText: 'Spread',
                      odds: '+120',
                    },
                    {
                      selectionText: 'Over 45.5',
                      marketText: 'Total',
                      odds: '-110',
                    },
                  ],
                },
              ],
            },
          ],
          broadcasts: [
            {
              names: ['ESPN'],
            },
          ],
        },
      ],
      weather: {
        displayValue: 'Clear',
        temperature: 72,
        windSpeed: 8,
      },
    },
  ],
};

describe('sports-data integration', () => {
  let fetchGames: typeof import('@/lib/api/sports-data')['fetchGames'];

  beforeEach(async () => {
    vi.resetModules();
    process.env.KV_REST_API_URL = 'https://kv.example.com';
    process.env.KV_REST_API_TOKEN = 'test-token';
    const kvModule = await import('@vercel/kv');
    (kvModule.kv as any).__store.clear?.();

    global.fetch = vi.fn(async () =>
      ({
        ok: true,
        json: async () => scoreboardResponse,
      } as unknown as Response)
    );

    ({ fetchGames } = await import('@/lib/api/sports-data'));
  });

  it('maps ESPN scoreboard data into internal Game objects with featured parlays', async () => {
    const games = await fetchGames('NFL');

    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(games).toHaveLength(1);

    const game = games[0];
    expect(game.league).toBe('NFL');
    expect(game.homeTeam.name).toBe('Home Heroes');
    expect(game.awayTeam.abbreviation).toBe('ROA');
    expect(game.odds?.moneyline?.home).toBe(-125);
    expect(game.odds?.total?.line).toBe(45.5);

    expect(game.prediction?.winner).toBeTypeOf('string');
    expect(game.weather?.conditions).toBe('Clear');
    expect(game.broadcasts).toContain('ESPN');

    expect(game.featuredParlays).toBeDefined();
    expect(game.featuredParlays?.[0].title).toBe('Sunday Super Boost');
    expect(game.featuredParlays?.[0].odds).toBe(450);
    expect(game.featuredParlays?.[0].legs).toHaveLength(2);
  });

  it('supports cache hits without re-fetching data', async () => {
    const gamesFirst = await fetchGames('NFL');
    const gamesSecond = await fetchGames('NFL');

    expect(gamesFirst[0].homeTeam.id).toBe('home-team');
    expect(gamesSecond[0].homeTeam.id).toBe('home-team');
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it('falls back to mock data when the ESPN scoreboard request fails', async () => {
    vi.resetModules();
    const kvModule = await import('@vercel/kv');
    (kvModule.kv as any).__store.clear?.();
    process.env.KV_REST_API_URL = 'https://kv.example.com';
    process.env.KV_REST_API_TOKEN = 'test-token';

    global.fetch = vi.fn(async () => {
      throw new Error('network failure');
    });

    const { fetchGames: fallbackFetchGames } = await import('@/lib/api/sports-data');
    const games = await fallbackFetchGames('NFL');

    expect(global.fetch).toHaveBeenCalled();
    expect(games.length).toBeGreaterThan(0);
    expect(games[0].id).toContain('nfl-mock');
  });
});
