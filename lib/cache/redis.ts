/**
 * Redis Caching Service using Vercel KV
 * 
 * Dramatically reduces API calls and improves performance
 * - Player stats: Cache for 1 hour
 * - Game odds: Cache for 2 minutes
 * - Player props: Cache for 5 minutes
 */

import { kv } from '@vercel/kv';

export interface CacheConfig {
  ttl: number; // Time to live in seconds
  key: string;
}

/**
 * Cache TTL configurations (in seconds)
 */
export const CACHE_TTL = {
  PLAYER_STATS: 60 * 60, // 1 hour - player stats don't change often
  GAME_ODDS: 2 * 60, // 2 minutes - odds update frequently
  PLAYER_PROPS: 5 * 60, // 5 minutes - props update less frequently
  ESPN_DATA: 30 * 60, // 30 minutes - ESPN data is relatively static
  GAME_LIST: 5 * 60, // 5 minutes - game schedule
  PREDICTIONS: 10 * 60, // 10 minutes - ML predictions
  WEATHER: 30 * 60, // 30 minutes - weather data
} as const;

/**
 * Generate a cache key with prefix
 */
export function generateCacheKey(prefix: string, ...parts: (string | number)[]): string {
  return `linepointer:${prefix}:${parts.join(':')}`;
}

/**
 * Check if KV is available
 */
function isKVAvailable(): boolean {
  return !!(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);
}

/**
 * Get data from cache
 */
export async function getFromCache<T>(key: string): Promise<T | null> {
  if (!isKVAvailable()) {
    console.log('[CACHE] KV not configured yet - skipping cache');
    return null;
  }

  try {
    const cached = await kv.get<T>(key);
    if (cached) {
      console.log(`[CACHE HIT] ${key}`);
      return cached;
    }
    console.log(`[CACHE MISS] ${key}`);
    return null;
  } catch (error) {
    console.error(`[CACHE ERROR] Failed to get ${key}:`, error);
    return null;
  }
}

/**
 * Set data in cache with TTL
 */
export async function setInCache<T>(
  key: string,
  data: T,
  ttlSeconds: number
): Promise<void> {
  if (!isKVAvailable()) {
    return; // Silently skip if KV not configured
  }

  try {
    await kv.set(key, data, { ex: ttlSeconds });
    console.log(`[CACHE SET] ${key} (TTL: ${ttlSeconds}s)`);
  } catch (error) {
    console.error(`[CACHE ERROR] Failed to set ${key}:`, error);
  }
}

/**
 * Delete data from cache
 */
export async function deleteFromCache(key: string): Promise<void> {
  try {
    await kv.del(key);
    console.log(`[CACHE DELETE] ${key}`);
  } catch (error) {
    console.error(`[CACHE ERROR] Failed to delete ${key}:`, error);
  }
}

/**
 * Delete multiple keys matching a pattern
 */
export async function deleteCachePattern(pattern: string): Promise<void> {
  try {
    // Vercel KV doesn't support pattern matching directly
    // This is a placeholder for manual key tracking if needed
    console.log(`[CACHE DELETE PATTERN] ${pattern}`);
  } catch (error) {
    console.error(`[CACHE ERROR] Failed to delete pattern ${pattern}:`, error);
  }
}

/**
 * Cached fetch wrapper - fetches data with automatic caching
 */
export async function cachedFetch<T>(
  key: string,
  ttlSeconds: number,
  fetchFn: () => Promise<T>
): Promise<T> {
  // Try to get from cache first
  const cached = await getFromCache<T>(key);
  if (cached !== null) {
    return cached;
  }

  // Fetch fresh data
  console.log(`[CACHE FETCH] Fetching fresh data for ${key}`);
  const data = await fetchFn();

  // Store in cache
  await setInCache(key, data, ttlSeconds);

  return data;
}

/**
 * Cache player stats from ESPN
 */
export async function cachePlayerStats<T>(
  sport: 'nfl' | 'ncaaf',
  playerId: string,
  fetchFn: () => Promise<T>
): Promise<T> {
  const key = generateCacheKey('player', sport, playerId);
  return cachedFetch(key, CACHE_TTL.PLAYER_STATS, fetchFn);
}

/**
 * Cache player list
 */
export async function cachePlayerList<T>(
  sport: 'nfl' | 'ncaaf',
  position: string,
  limit: number,
  fetchFn: () => Promise<T>
): Promise<T> {
  const key = generateCacheKey('players', sport, position, limit);
  return cachedFetch(key, CACHE_TTL.ESPN_DATA, fetchFn);
}

/**
 * Cache game odds
 */
export async function cacheGameOdds<T>(
  sport: 'nfl' | 'ncaaf' | 'nba' | 'mlb',
  fetchFn: () => Promise<T>
): Promise<T> {
  const key = generateCacheKey('odds', sport, 'games');
  return cachedFetch(key, CACHE_TTL.GAME_ODDS, fetchFn);
}

/**
 * Cache player props
 */
export async function cachePlayerProps<T>(
  sport: 'nfl' | 'ncaaf' | 'nba' | 'mlb',
  playerName: string,
  fetchFn: () => Promise<T>
): Promise<T> {
  const key = generateCacheKey('props', sport, playerName.toLowerCase());
  return cachedFetch(key, CACHE_TTL.PLAYER_PROPS, fetchFn);
}

/**
 * Cache all player props
 */
export async function cacheAllPlayerProps<T>(
  sport: 'nfl' | 'ncaaf',
  fetchFn: () => Promise<T>
): Promise<T> {
  const key = generateCacheKey('props', sport, 'all');
  return cachedFetch(key, CACHE_TTL.PLAYER_PROPS, fetchFn);
}

/**
 * Cache weather data
 */
export async function cacheWeather<T>(
  teamAbbr: string,
  date: Date,
  fetchFn: () => Promise<T>
): Promise<T> {
  const dateKey = date.toISOString().split('T')[0]; // YYYY-MM-DD
  const key = generateCacheKey('weather', teamAbbr, dateKey);
  return cachedFetch(key, CACHE_TTL.WEATHER, fetchFn);
}

/**
 * Cache ML predictions
 */
export async function cachePrediction<T>(
  gameId: string,
  fetchFn: () => Promise<T>
): Promise<T> {
  const key = generateCacheKey('prediction', gameId);
  return cachedFetch(key, CACHE_TTL.PREDICTIONS, fetchFn);
}

/**
 * Get cache statistics (for monitoring)
 */
export async function getCacheStats(): Promise<{
  hits: number;
  misses: number;
  size: number;
}> {
  // This would require custom tracking in a production system
  // For now, return mock data
  return {
    hits: 0,
    misses: 0,
    size: 0,
  };
}

/**
 * Clear all cache (use with caution!)
 */
export async function clearAllCache(): Promise<void> {
  try {
    // Vercel KV doesn't have a clear all command
    // You'd need to track keys manually or use Redis SCAN
    console.log('[CACHE] Clear all cache not implemented for Vercel KV');
  } catch (error) {
    console.error('[CACHE ERROR] Failed to clear cache:', error);
  }
}

const RedisCacheAPI = {
  getFromCache,
  setInCache,
  deleteFromCache,
  cachedFetch,
  cachePlayerStats,
  cachePlayerList,
  cacheGameOdds,
  cachePlayerProps,
  cacheAllPlayerProps,
  cacheWeather,
  cachePrediction,
  getCacheStats,
  clearAllCache,
  CACHE_TTL,
  generateCacheKey,
};

export default RedisCacheAPI;

