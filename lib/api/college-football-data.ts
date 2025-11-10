/**
 * College Football Data API Integration
 * https://collegefootballdata.com/
 * 
 * Provides comprehensive NCAAF data:
 * - Team stats and rankings
 * - Player statistics
 * - Game data and betting lines
 * - Advanced metrics (EPA, success rate, etc.)
 */

import axios from 'axios';
import { cachedFetch, generateCacheKey, CACHE_TTL } from '@/lib/cache/redis';

const CFB_API_KEY = process.env.NEXT_PUBLIC_CFB_API_KEY;
const BASE_URL = 'https://api.collegefootballdata.com';

export interface CFBTeam {
  id: number;
  school: string;
  mascot: string;
  abbreviation: string;
  color: string;
  alt_color: string;
  logos: string[];
  conference: string;
}

export interface CFBPlayer {
  id: number;
  name: string;
  team: string;
  position: string;
  height: number;
  weight: number;
  year: number;
  jersey: number;
}

export interface CFBPlayerStats {
  playerId: number;
  player: string;
  team: string;
  category: string;
  statType: string;
  stat: number;
}

export interface CFBGame {
  id: number;
  season: number;
  week: number;
  season_type: string;
  start_date: string;
  home_team: string;
  home_conference: string;
  home_points: number;
  away_team: string;
  away_conference: string;
  away_points: number;
  attendance: number;
  venue: string;
}

export interface CFBBettingLine {
  id: number;
  season: number;
  week: number;
  home_team: string;
  away_team: string;
  spread: number;
  over_under: number;
  home_moneyline: number;
  away_moneyline: number;
  provider: string;
}

const axiosConfig = {
  headers: CFB_API_KEY ? {
    'Authorization': `Bearer ${CFB_API_KEY}`,
  } : {},
  timeout: 10000,
};

/**
 * Get all FBS teams
 */
export async function getCFBTeams(): Promise<CFBTeam[]> {
  const cacheKey = generateCacheKey('cfb', 'teams');
  
  return cachedFetch(cacheKey, CACHE_TTL.ESPN_DATA, async () => {
    const response = await axios.get(
      `${BASE_URL}/teams/fbs`,
      axiosConfig
    );
    return response.data;
  });
}

/**
 * Get team roster
 */
export async function getCFBRoster(team: string, year: number = new Date().getFullYear()): Promise<CFBPlayer[]> {
  const cacheKey = generateCacheKey('cfb', 'roster', team, year);
  
  return cachedFetch(cacheKey, CACHE_TTL.ESPN_DATA, async () => {
    const response = await axios.get(
      `${BASE_URL}/roster`,
      {
        ...axiosConfig,
        params: { team, year },
      }
    );
    return response.data;
  });
}

/**
 * Get player season stats
 */
export async function getCFBPlayerStats(
  year: number,
  team?: string,
  category?: 'passing' | 'rushing' | 'receiving'
): Promise<CFBPlayerStats[]> {
  const cacheKey = generateCacheKey('cfb', 'stats', year, team || 'all', category || 'all');
  
  return cachedFetch(cacheKey, CACHE_TTL.PLAYER_STATS, async () => {
    const response = await axios.get(
      `${BASE_URL}/stats/player/season`,
      {
        ...axiosConfig,
        params: { year, team, category },
      }
    );
    return response.data;
  });
}

/**
 * Get games for a specific week
 */
export async function getCFBGames(
  year: number,
  week: number,
  seasonType: 'regular' | 'postseason' = 'regular'
): Promise<CFBGame[]> {
  const cacheKey = generateCacheKey('cfb', 'games', year, week, seasonType);
  
  return cachedFetch(cacheKey, CACHE_TTL.GAME_LIST, async () => {
    const response = await axios.get(
      `${BASE_URL}/games`,
      {
        ...axiosConfig,
        params: {
          year,
          week,
          seasonType,
        },
      }
    );
    return response.data;
  });
}

/**
 * Get betting lines for games
 */
export async function getCFBBettingLines(
  year: number,
  week: number,
  team?: string
): Promise<CFBBettingLine[]> {
  const cacheKey = generateCacheKey('cfb', 'lines', year, week, team || 'all');
  
  return cachedFetch(cacheKey, CACHE_TTL.GAME_ODDS, async () => {
    const response = await axios.get(
      `${BASE_URL}/lines`,
      {
        ...axiosConfig,
        params: { year, week, team },
      }
    );
    return response.data;
  });
}

/**
 * Get team statistics
 */
export async function getCFBTeamStats(year: number, team?: string) {
  const cacheKey = generateCacheKey('cfb', 'team-stats', year, team || 'all');
  
  return cachedFetch(cacheKey, CACHE_TTL.PLAYER_STATS, async () => {
    const response = await axios.get(
      `${BASE_URL}/stats/season`,
      {
        ...axiosConfig,
        params: { year, team },
      }
    );
    return response.data;
  });
}

/**
 * Get advanced team stats (EPA, success rate, etc.)
 */
export async function getCFBAdvancedStats(
  year: number,
  team?: string
) {
  const cacheKey = generateCacheKey('cfb', 'advanced-stats', year, team || 'all');
  
  return cachedFetch(cacheKey, CACHE_TTL.PREDICTIONS, async () => {
    const response = await axios.get(
      `${BASE_URL}/stats/season/advanced`,
      {
        ...axiosConfig,
        params: { year, team },
      }
    );
    return response.data;
  });
}

const CollegeFootballDataAPI = {
  getCFBTeams,
  getCFBRoster,
  getCFBPlayerStats,
  getCFBGames,
  getCFBBettingLines,
  getCFBTeamStats,
  getCFBAdvancedStats,
};

export default CollegeFootballDataAPI;

