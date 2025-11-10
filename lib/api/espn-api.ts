/**
 * ESPN Hidden API Service
 * 
 * This service provides FREE access to ESPN's comprehensive player data
 * No API key required - uses ESPN's public endpoints
 * 
 * Coverage: NFL + NCAAF
 * Data: Player stats, team info, game logs, images
 */

export interface ESPNPlayerStats {
  id: string;
  name: string;
  displayName: string;
  firstName: string;
  lastName: string;
  position: string;
  jersey: string;
  team: {
    id: string;
    name: string;
    logo: string;
    abbreviation: string;
    color: string;
  };
  stats: {
    passing?: {
      yards: number;
      touchdowns: number;
      interceptions: number;
      completions: number;
      attempts: number;
      completionPercentage: number;
      rating: number;
      yardsPerAttempt: number;
    };
    rushing?: {
      yards: number;
      touchdowns: number;
      attempts: number;
      yardsPerCarry: number;
      longRush: number;
    };
    receiving?: {
      receptions: number;
      yards: number;
      touchdowns: number;
      targets: number;
      yardsPerReception: number;
      longReception: number;
    };
  };
  image: string;
  age?: number;
  height?: string;
  weight?: string;
  college?: string;
  experience?: number;
}

export interface ESPNGameLog {
  gameId: string;
  date: string;
  opponent: string;
  result: string;
  stats: any;
}

const ESPN_BASE = 'https://site.api.espn.com';
const ESPN_CORE = 'https://sports.core.api.espn.com';

export class ESPNService {
  /**
   * Get all NFL players
   * @param limit - Maximum number of players to return (default: 500)
   */
  static async getAllNFLPlayers(limit: number = 500): Promise<ESPNPlayerStats[]> {
    try {
      const response = await fetch(
        `${ESPN_BASE}/apis/site/v2/sports/football/nfl/athletes?limit=${limit}`,
        { next: { revalidate: 3600 } } // Cache for 1 hour
      );
      
      if (!response.ok) throw new Error('Failed to fetch NFL players');
      
      const data = await response.json();
      
      return data.athletes.map((athlete: any) => this.mapAthleteToPlayer(athlete));
    } catch (error) {
      console.error('ESPN NFL Players API Error:', error);
      return [];
    }
  }

  /**
   * Get all NCAAF players
   * @param limit - Maximum number of players to return
   */
  static async getAllNCAAFPlayers(limit: number = 500): Promise<ESPNPlayerStats[]> {
    try {
      const response = await fetch(
        `${ESPN_BASE}/apis/site/v2/sports/football/college-football/athletes?limit=${limit}`,
        { next: { revalidate: 3600 } }
      );
      
      if (!response.ok) throw new Error('Failed to fetch NCAAF players');
      
      const data = await response.json();
      
      return data.athletes.map((athlete: any) => this.mapAthleteToPlayer(athlete));
    } catch (error) {
      console.error('ESPN NCAAF Players API Error:', error);
      return [];
    }
  }

  /**
   * Get specific player details by ID
   * @param playerId - ESPN player ID
   * @param sport - 'nfl' or 'college-football'
   */
  static async getPlayer(playerId: string, sport: 'nfl' | 'college-football' = 'nfl'): Promise<ESPNPlayerStats | null> {
    try {
      const response = await fetch(
        `${ESPN_BASE}/apis/common/v3/sports/football/${sport}/athletes/${playerId}`,
        { next: { revalidate: 1800 } } // Cache for 30 minutes
      );
      
      if (!response.ok) throw new Error('Player not found');
      
      const data = await response.json();
      const athlete = data.athlete;
      const statistics = data.statistics?.[0];
      
      const player = this.mapAthleteToPlayer(athlete);
      
      // Add detailed stats if available
      if (statistics?.splits?.categories) {
        player.stats = this.parseDetailedStats(
          statistics.splits.categories,
          athlete.position.abbreviation
        );
      }
      
      return player;
    } catch (error) {
      console.error('ESPN Player API Error:', error);
      return null;
    }
  }

  /**
   * Search players by name
   * @param query - Search term
   * @param sport - 'nfl' or 'college-football'
   */
  static async searchPlayers(query: string, sport: 'nfl' | 'college-football' = 'nfl'): Promise<ESPNPlayerStats[]> {
    const allPlayers = sport === 'nfl' 
      ? await this.getAllNFLPlayers(500)
      : await this.getAllNCAAFPlayers(500);
    
    const searchTerm = query.toLowerCase();
    return allPlayers.filter(player =>
      player.name.toLowerCase().includes(searchTerm) ||
      player.team.name.toLowerCase().includes(searchTerm) ||
      player.team.abbreviation.toLowerCase().includes(searchTerm)
    );
  }

  /**
   * Get player game log
   * @param playerId - ESPN player ID
   * @param season - Season year (default: current)
   */
  static async getPlayerGameLog(
    playerId: string, 
    season: string = '2024'
  ): Promise<ESPNGameLog[]> {
    try {
      const response = await fetch(
        `${ESPN_CORE}/v2/sports/football/leagues/nfl/seasons/${season}/athletes/${playerId}/eventlog`,
        { next: { revalidate: 3600 } }
      );
      
      if (!response.ok) throw new Error('Game log not found');
      
      const data = await response.json();
      
      // Transform game log data
      return data.events?.map((event: any) => ({
        gameId: event.id,
        date: event.date,
        opponent: event.opponent?.displayName || 'Unknown',
        result: event.result || 'Unknown',
        stats: event.stats || {},
      })) || [];
    } catch (error) {
      console.error('ESPN Game Log Error:', error);
      return [];
    }
  }

  /**
   * Get players by position
   * @param position - Position abbreviation (QB, RB, WR, TE, etc.)
   * @param sport - 'nfl' or 'college-football'
   */
  static async getPlayersByPosition(
    position: string,
    sport: 'nfl' | 'college-football' = 'nfl'
  ): Promise<ESPNPlayerStats[]> {
    const allPlayers = sport === 'nfl'
      ? await this.getAllNFLPlayers(500)
      : await this.getAllNCAAFPlayers(500);
    
    return allPlayers.filter(player => 
      player.position.toUpperCase() === position.toUpperCase()
    );
  }

  /**
   * Get players by team
   * @param teamId - ESPN team ID
   * @param sport - 'nfl' or 'college-football'
   */
  static async getTeamRoster(
    teamId: string,
    sport: 'nfl' | 'college-football' = 'nfl'
  ): Promise<ESPNPlayerStats[]> {
    try {
      const response = await fetch(
        `${ESPN_BASE}/apis/site/v2/sports/football/${sport}/teams/${teamId}/roster`,
        { next: { revalidate: 3600 } }
      );
      
      if (!response.ok) throw new Error('Roster not found');
      
      const data = await response.json();
      
      return data.athletes?.map((athlete: any) => this.mapAthleteToPlayer(athlete)) || [];
    } catch (error) {
      console.error('ESPN Roster Error:', error);
      return [];
    }
  }

  /**
   * Map ESPN athlete data to our player format
   */
  private static mapAthleteToPlayer(athlete: any): ESPNPlayerStats {
    return {
      id: athlete.id,
      name: athlete.displayName || athlete.fullName,
      displayName: athlete.displayName || athlete.fullName,
      firstName: athlete.firstName || '',
      lastName: athlete.lastName || '',
      position: athlete.position?.abbreviation || 'N/A',
      jersey: athlete.jersey || '',
      team: {
        id: athlete.team?.id || '',
        name: athlete.team?.name || 'Free Agent',
        logo: athlete.team?.logos?.[0]?.href || athlete.team?.logo || '',
        abbreviation: athlete.team?.abbreviation || 'FA',
        color: athlete.team?.color || '000000',
      },
      stats: {}, // Will be populated separately
      image: athlete.headshot?.href || athlete.headshot || '',
      age: athlete.age,
      height: athlete.height,
      weight: athlete.weight,
      college: athlete.college?.name,
      experience: athlete.experience?.years,
    };
  }

  /**
   * Parse detailed stats from ESPN format
   */
  private static parseDetailedStats(categories: any[], position: string) {
    const stats: any = {};
    
    categories.forEach((category: any) => {
      category.stats?.forEach((stat: any) => {
        const value = parseFloat(stat.value);
        
        switch (stat.name) {
          // Passing stats
          case 'passingYards':
          case 'yards':
            if (position === 'QB') {
              stats.passing = stats.passing || {};
              stats.passing.yards = value;
            }
            break;
          case 'passingTouchdowns':
          case 'touchdowns':
            if (position === 'QB') {
              stats.passing = stats.passing || {};
              stats.passing.touchdowns = parseInt(stat.value);
            }
            break;
          case 'interceptions':
            stats.passing = stats.passing || {};
            stats.passing.interceptions = parseInt(stat.value);
            break;
          case 'completions':
            stats.passing = stats.passing || {};
            stats.passing.completions = parseInt(stat.value);
            break;
          case 'passingAttempts':
          case 'attempts':
            if (position === 'QB') {
              stats.passing = stats.passing || {};
              stats.passing.attempts = parseInt(stat.value);
              if (stats.passing.completions) {
                stats.passing.completionPercentage = 
                  (stats.passing.completions / stats.passing.attempts) * 100;
              }
            }
            break;
          case 'QBRating':
          case 'passerRating':
            stats.passing = stats.passing || {};
            stats.passing.rating = value;
            break;
          case 'yardsPerPassAttempt':
            stats.passing = stats.passing || {};
            stats.passing.yardsPerAttempt = value;
            break;
            
          // Rushing stats
          case 'rushingYards':
            stats.rushing = stats.rushing || {};
            stats.rushing.yards = value;
            break;
          case 'rushingTouchdowns':
            stats.rushing = stats.rushing || {};
            stats.rushing.touchdowns = parseInt(stat.value);
            break;
          case 'rushingAttempts':
            stats.rushing = stats.rushing || {};
            stats.rushing.attempts = parseInt(stat.value);
            if (stats.rushing.yards) {
              stats.rushing.yardsPerCarry = stats.rushing.yards / stats.rushing.attempts;
            }
            break;
          case 'longRushing':
            stats.rushing = stats.rushing || {};
            stats.rushing.longRush = parseInt(stat.value);
            break;
            
          // Receiving stats
          case 'receptions':
            stats.receiving = stats.receiving || {};
            stats.receiving.receptions = parseInt(stat.value);
            break;
          case 'receivingYards':
            stats.receiving = stats.receiving || {};
            stats.receiving.yards = value;
            break;
          case 'receivingTouchdowns':
            stats.receiving = stats.receiving || {};
            stats.receiving.touchdowns = parseInt(stat.value);
            break;
          case 'receivingTargets':
            stats.receiving = stats.receiving || {};
            stats.receiving.targets = parseInt(stat.value);
            break;
          case 'yardsPerReception':
            stats.receiving = stats.receiving || {};
            stats.receiving.yardsPerReception = value;
            break;
          case 'longReception':
            stats.receiving = stats.receiving || {};
            stats.receiving.longReception = parseInt(stat.value);
            break;
        }
      });
    });
    
    return stats;
  }
}

export default ESPNService;

