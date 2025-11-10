/**
 * Pro Football Reference Scraping Service
 * https://www.pro-football-reference.com/
 * 
 * Scrapes historical NFL data:
 * - Historical game results
 * - Player career statistics
 * - Team performance over time
 * - Advanced metrics and trends
 */

import axios from 'axios';
import * as cheerio from 'cheerio';
import { cachedFetch, generateCacheKey, CACHE_TTL } from '@/lib/cache/redis';

const BASE_URL = 'https://www.pro-football-reference.com';

export interface PFRGame {
  date: string;
  week: number;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  homeYards: number;
  awayYards: number;
  homeTurnovers: number;
  awayTurnovers: number;
}

export interface PFRPlayerStats {
  player: string;
  team: string;
  position: string;
  age: number;
  games: number;
  gamesStarted: number;
  stats: {
    passing?: {
      completions: number;
      attempts: number;
      yards: number;
      touchdowns: number;
      interceptions: number;
      rating: number;
    };
    rushing?: {
      attempts: number;
      yards: number;
      touchdowns: number;
      yardsPerAttempt: number;
    };
    receiving?: {
      receptions: number;
      yards: number;
      touchdowns: number;
      yardsPerReception: number;
    };
  };
}

export interface PFRTeamStats {
  team: string;
  year: number;
  wins: number;
  losses: number;
  ties: number;
  pointsFor: number;
  pointsAgainst: number;
  pointDifferential: number;
  strengthOfSchedule: number;
  simpleRatingSystem: number;
}

/**
 * Parse HTML table to extract data
 */
function parseTable($: cheerio.CheerioAPI, tableId: string): any[] {
  const data: any[] = [];
  const table = $(`#${tableId}`);
  
  if (!table.length) return data;

  const headers: string[] = [];
  table.find('thead tr th').each((i, el) => {
    headers.push($(el).attr('data-stat') || '');
  });

  table.find('tbody tr').each((i, row) => {
    if ($(row).hasClass('thead')) return; // Skip header rows in body
    
    const rowData: any = {};
    $(row).find('td, th').each((j, cell) => {
      const stat = $(cell).attr('data-stat');
      const value = $(cell).text().trim();
      if (stat) {
        rowData[stat] = value;
      }
    });
    
    if (Object.keys(rowData).length > 0) {
      data.push(rowData);
    }
  });

  return data;
}

/**
 * Get team schedule and results for a season
 */
export async function getPFRTeamSchedule(
  teamAbbr: string,
  year: number = new Date().getFullYear()
): Promise<PFRGame[]> {
  const cacheKey = generateCacheKey('pfr', 'schedule', teamAbbr, year);
  
  return cachedFetch(cacheKey, CACHE_TTL.ESPN_DATA, async () => {
    try {
      const response = await axios.get(
        `${BASE_URL}/teams/${teamAbbr}/${year}.htm`,
        { timeout: 10000 }
      );
      
      const $ = cheerio.load(response.data);
      const games: PFRGame[] = [];
      
      const tableData = parseTable($, 'games');
      
      tableData.forEach((row: any) => {
        if (row.week_num && row.game_date) {
          games.push({
            date: row.game_date,
            week: parseInt(row.week_num),
            homeTeam: row.game_location === '@' ? row.opp : teamAbbr,
            awayTeam: row.game_location === '@' ? teamAbbr : row.opp,
            homeScore: row.game_location === '@' ? parseInt(row.opp_score) || 0 : parseInt(row.pts_off) || 0,
            awayScore: row.game_location === '@' ? parseInt(row.pts_off) || 0 : parseInt(row.opp_score) || 0,
            homeYards: 0, // Would need additional parsing
            awayYards: 0,
            homeTurnovers: 0,
            awayTurnovers: 0,
          });
        }
      });
      
      return games;
    } catch (error) {
      console.error(`Error scraping PFR schedule for ${teamAbbr}:`, error);
      return [];
    }
  });
}

/**
 * Get player career statistics
 */
export async function getPFRPlayerCareer(playerId: string): Promise<PFRPlayerStats | null> {
  const cacheKey = generateCacheKey('pfr', 'player', playerId);
  
  return cachedFetch(cacheKey, CACHE_TTL.PLAYER_STATS, async () => {
    try {
      const response = await axios.get(
        `${BASE_URL}/players/${playerId[0]}/${playerId}.htm`,
        { timeout: 10000 }
      );
      
      const $ = cheerio.load(response.data);
      
      // Extract player info
      const playerName = $('#meta h1 span').first().text().trim();
      const position = $('#meta p').text().match(/Position:\s*(\w+)/)?.[1] || 'Unknown';
      
      // This would need more detailed parsing for actual stats
      return {
        player: playerName,
        team: 'Various',
        position,
        age: 0,
        games: 0,
        gamesStarted: 0,
        stats: {},
      };
    } catch (error) {
      console.error(`Error scraping PFR player ${playerId}:`, error);
      return null;
    }
  });
}

/**
 * Get team season statistics
 */
export async function getPFRTeamStats(
  teamAbbr: string,
  year: number = new Date().getFullYear()
): Promise<PFRTeamStats | null> {
  const cacheKey = generateCacheKey('pfr', 'team-stats', teamAbbr, year);
  
  return cachedFetch(cacheKey, CACHE_TTL.PLAYER_STATS, async () => {
    try {
      const response = await axios.get(
        `${BASE_URL}/teams/${teamAbbr}/${year}.htm`,
        { timeout: 10000 }
      );
      
      const $ = cheerio.load(response.data);
      
      // Extract team record
      const recordText = $('#meta p').text();
      const record = recordText.match(/Record:\s*(\d+)-(\d+)(?:-(\d+))?/);
      
      const wins = record ? parseInt(record[1]) : 0;
      const losses = record ? parseInt(record[2]) : 0;
      const ties = record?.[3] ? parseInt(record[3]) : 0;
      
      return {
        team: teamAbbr,
        year,
        wins,
        losses,
        ties,
        pointsFor: 0, // Would need table parsing
        pointsAgainst: 0,
        pointDifferential: 0,
        strengthOfSchedule: 0,
        simpleRatingSystem: 0,
      };
    } catch (error) {
      console.error(`Error scraping PFR team stats for ${teamAbbr}:`, error);
      return null;
    }
  });
}

/**
 * Get historical matchup data between two teams
 */
export async function getPFRHeadToHead(
  team1: string,
  team2: string,
  yearsBack: number = 10
): Promise<PFRGame[]> {
  const cacheKey = generateCacheKey('pfr', 'h2h', team1, team2, yearsBack);
  
  return cachedFetch(cacheKey, CACHE_TTL.ESPN_DATA, async () => {
    const games: PFRGame[] = [];
    const currentYear = new Date().getFullYear();
    
    // Fetch schedules for both teams over the years
    for (let year = currentYear; year > currentYear - yearsBack; year--) {
      const schedule = await getPFRTeamSchedule(team1, year);
      const matchups = schedule.filter(game => 
        game.homeTeam === team2 || game.awayTeam === team2
      );
      games.push(...matchups);
    }
    
    return games;
  });
}

const ProFootballReferenceAPI = {
  getPFRTeamSchedule,
  getPFRPlayerCareer,
  getPFRTeamStats,
  getPFRHeadToHead,
};

export default ProFootballReferenceAPI;

