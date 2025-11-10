/**
 * Data Aggregation Service
 * Combines all data sources into comprehensive game and player insights
 * 
 * Data Sources:
 * 1. ESPN API - Player stats, team info
 * 2. The Odds API - Real-time betting odds
 * 3. College Football Data API - NCAAF stats
 * 4. Pro Football Reference - Historical data
 * 5. nflfastR - Advanced analytics (EPA, WPA)
 * 6. Next Gen Stats - Player tracking data
 * 7. OpenWeatherMap - Weather impact
 */

import { ESPNService } from './espn-api';
import { getAllPlayerProps } from './player-props-odds';
import CFBData from './college-football-data';
import PFRData from './pro-football-reference';
import NFLFastRData from './nflfastr-data';
import NGSData from './next-gen-stats';
import { fetchWeather, calculateWeatherImpact } from './weather-service';
import { cachedFetch, generateCacheKey, CACHE_TTL } from '@/lib/cache/redis';

export interface AggregatedPlayerData {
  // Basic Info (ESPN)
  id: string;
  name: string;
  team: string;
  position: string;
  jerseyNumber?: string;
  photo?: string;
  
  // Current Season Stats (ESPN)
  stats: {
    passing?: any;
    rushing?: any;
    receiving?: any;
  };
  
  // Advanced Metrics (nflfastR)
  advanced?: {
    epa_per_play?: number;
    success_rate?: number;
    total_epa?: number;
  };
  
  // Next Gen Stats
  tracking?: {
    avgTimeToThrow?: number;
    avgSeparation?: number;
    avgYAC?: number;
  };
  
  // Betting Props (The Odds API)
  props?: Array<{
    type: string;
    line: number;
    overOdds: number;
    underOdds: number;
  }>;
  
  // Historical Performance (PFR)
  historical?: {
    careerGames: number;
    careerYards: number;
    careerTDs: number;
  };
}

export interface AggregatedGameData {
  // Basic Game Info
  id: string;
  date: Date;
  homeTeam: string;
  awayTeam: string;
  venue: string;
  
  // Betting Lines (The Odds API)
  odds: {
    spread: { home: number; away: number; homeOdds: number; awayOdds: number };
    moneyline: { home: number; away: number };
    total: { line: number; over: number; under: number };
  };
  
  // Weather Impact (OpenWeatherMap)
  weather: {
    temperature: number;
    conditions: string;
    windSpeed: number;
    impactScore: number;
    recommendation: string;
  };
  
  // Team Performance (Multiple Sources)
  homeTeamStats: {
    record: string;
    pointsPerGame: number;
    pointsAllowedPerGame: number;
    epaPerPlay?: number;
    successRate?: number;
  };
  
  awayTeamStats: {
    record: string;
    pointsPerGame: number;
    pointsAllowedPerGame: number;
    epaPerPlay?: number;
    successRate?: number;
  };
  
  // Historical Matchup (PFR)
  headToHead: {
    homeWins: number;
    awayWins: number;
    lastMeetingScore?: string;
    avgHomeScore?: number;
    avgAwayScore?: number;
  };
  
  // ML Prediction
  prediction: {
    homeWinProbability: number;
    awayWinProbability: number;
    predictedSpread: number;
    predictedTotal: number;
    confidence: number;
  };
}

/**
 * Aggregate all data for a specific player
 */
export async function aggregatePlayerData(
  playerId: string,
  sport: 'nfl' | 'ncaaf' = 'nfl'
): Promise<AggregatedPlayerData | null> {
  const cacheKey = generateCacheKey('aggregated', 'player', playerId, sport);
  
  return cachedFetch(cacheKey, CACHE_TTL.PLAYER_STATS, async () => {
    const data: Partial<AggregatedPlayerData> = {};
    
    try {
      // 1. Get ESPN data (basic stats)
      const espnPlayer = await ESPNService.getPlayer(playerId, sport === 'nfl' ? 'nfl' : 'college-football');
      if (espnPlayer) {
        data.id = espnPlayer.id;
        data.name = espnPlayer.displayName || espnPlayer.name;
        data.team = espnPlayer.team?.name || '';
        data.position = espnPlayer.position || '';
        data.jerseyNumber = espnPlayer.jersey;
        data.photo = espnPlayer.image || data.photo;
        data.stats = espnPlayer.stats || {};
      }
      
      // 2. Get nflfastR advanced metrics (NFL only)
      if (sport === 'nfl') {
        const advancedMetrics = await NFLFastRData.getNFLFastRPlayerMetrics(
          playerId,
          new Date().getFullYear()
        );
        if (advancedMetrics) {
          data.advanced = advancedMetrics;
        }
      }
      
      // 3. Get Next Gen Stats (NFL only)
      if (sport === 'nfl' && data.position) {
        const statType = data.position === 'QB' ? 'passing' : 
                        data.position === 'RB' ? 'rushing' : 'receiving';
        const ngsStats = await NGSData.getNGSPlayerStats(
          playerId,
          new Date().getFullYear(),
          statType as any
        );
        if (ngsStats) {
          data.tracking = {
            avgTimeToThrow: ngsStats.avgTimeToThrow,
            avgSeparation: ngsStats.avgSeparation,
            avgYAC: ngsStats.avgYAC,
          };
        }
      }
      
      // 4. Get betting props
      if (data.name) {
        const propsData = await getAllPlayerProps(sport);
        if (propsData.success) {
          const playerProps = propsData.props.filter(p => 
            p.playerName.toLowerCase().includes(data.name!.toLowerCase())
          );
          data.props = playerProps.map(p => ({
            type: p.propDescription,
            line: p.line,
            overOdds: p.overOdds,
            underOdds: p.underOdds,
          }));
        }
      }
      
      return data as AggregatedPlayerData;
    } catch (error) {
      console.error(`Error aggregating player data for ${playerId}:`, error);
      return null;
    }
  });
}

/**
 * Aggregate all data for a specific game
 */
export async function aggregateGameData(
  homeTeam: string,
  awayTeam: string,
  gameDate: Date,
  sport: 'nfl' | 'ncaaf' = 'nfl'
): Promise<AggregatedGameData | null> {
  const cacheKey = generateCacheKey('aggregated', 'game', homeTeam, awayTeam, gameDate.toISOString());
  
  return cachedFetch(cacheKey, CACHE_TTL.GAME_ODDS, async () => {
    try {
      const data: Partial<AggregatedGameData> = {
        id: `${homeTeam}-${awayTeam}-${gameDate.toISOString()}`,
        date: gameDate,
        homeTeam,
        awayTeam,
        venue: 'TBD', // Would come from schedule data
      };
      
      // 1. Get weather impact
      const weatherData = await fetchWeather(homeTeam, gameDate);
      const weatherImpact = calculateWeatherImpact(weatherData);
      data.weather = {
        temperature: weatherData?.temperature ?? 72,
        conditions: weatherData?.conditions ?? 'Unknown',
        windSpeed: weatherData?.windSpeed ?? 0,
        impactScore: weatherImpact.score,
        recommendation: weatherImpact.recommendation,
      };
      
      // 2. Get historical head-to-head (NFL only)
      if (sport === 'nfl') {
        const h2h = await PFRData.getPFRHeadToHead(homeTeam, awayTeam, 5);
        const homeWins = h2h.filter(g => 
          (g.homeTeam === homeTeam && g.homeScore > g.awayScore) ||
          (g.awayTeam === homeTeam && g.awayScore > g.homeScore)
        ).length;
        
        data.headToHead = {
          homeWins,
          awayWins: h2h.length - homeWins,
          avgHomeScore: h2h.length > 0 ? h2h.reduce((sum, g) => sum + (g.homeTeam === homeTeam ? g.homeScore : g.awayScore), 0) / h2h.length : 0,
          avgAwayScore: h2h.length > 0 ? h2h.reduce((sum, g) => sum + (g.awayTeam === awayTeam ? g.awayScore : g.homeScore), 0) / h2h.length : 0,
        };
      }
      
      // 3. Get team stats
      if (sport === 'ncaaf') {
        const homeStats = await CFBData.getCFBTeamStats(new Date().getFullYear(), homeTeam);
        const awayStats = await CFBData.getCFBTeamStats(new Date().getFullYear(), awayTeam);
        
        // Process and add to data
      } else {
        // Get NFL team stats from nflfastR
        const homeStats = await NFLFastRData.getNFLFastRTeamStats(homeTeam, new Date().getFullYear());
        const awayStats = await NFLFastRData.getNFLFastRTeamStats(awayTeam, new Date().getFullYear());
        
        if (homeStats) {
          data.homeTeamStats = {
            record: '0-0', // Would come from schedule data
            pointsPerGame: 0,
            pointsAllowedPerGame: 0,
            epaPerPlay: homeStats.epa_per_play,
            successRate: homeStats.success_rate,
          };
        }
        
        if (awayStats) {
          data.awayTeamStats = {
            record: '0-0',
            pointsPerGame: 0,
            pointsAllowedPerGame: 0,
            epaPerPlay: awayStats.epa_per_play,
            successRate: awayStats.success_rate,
          };
        }
      }
      
      // 4. Add ML prediction (would come from enhanced ML model)
      data.prediction = {
        homeWinProbability: 0.5,
        awayWinProbability: 0.5,
        predictedSpread: 0,
        predictedTotal: 0,
        confidence: 0,
      };
      
      return data as AggregatedGameData;
    } catch (error) {
      console.error(`Error aggregating game data:`, error);
      return null;
    }
  });
}

/**
 * Get comprehensive data for today's games
 */
export async function getTodaysGamesWithAllData(sport: 'nfl' | 'ncaaf' = 'nfl') {
  const cacheKey = generateCacheKey('aggregated', 'today', sport);
  
  return cachedFetch(cacheKey, CACHE_TTL.GAME_LIST, async () => {
    // This would fetch today's schedule and aggregate data for each game
    return [];
  });
}

const DataAggregatorAPI = {
  aggregatePlayerData,
  aggregateGameData,
  getTodaysGamesWithAllData,
};

export default DataAggregatorAPI;

