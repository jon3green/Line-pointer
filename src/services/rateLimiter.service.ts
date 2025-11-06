import { RATE_LIMITS } from '../config/api.config';

// Rate Limiter State Type
interface RateLimiterState {
  requests: number;
  windowStart: number;
  blocked: boolean;
};

class RateLimiterService {
  private limiters: Map<string, RateLimiterState> = new Map();

  /**
   * Check if request is allowed
   */
  async checkLimit(apiName: keyof typeof RATE_LIMITS): Promise<boolean> {
    const config = RATE_LIMITS[apiName];
    if (!config) return true; // No limit configured

    const now = Date.now();
    let state = this.limiters.get(apiName);

    // Initialize or reset window
    if (!state || (now - state.windowStart) >= config.window) {
      state = {
        requests: 0,
        windowStart: now,
        blocked: false
      };
      this.limiters.set(apiName, state);
    }

    // Check if blocked
    if (state.blocked) {
      const timeToReset = config.window - (now - state.windowStart);
      if (timeToReset > 0) {
        console.warn(`Rate limit exceeded for ${apiName}. Resets in ${Math.ceil(timeToReset / 1000)}s`);
        return false;
      } else {
        // Reset window
        state.requests = 0;
        state.windowStart = now;
        state.blocked = false;
      }
    }

    // Check if limit reached
    if (state.requests >= config.requests) {
      state.blocked = true;
      return false;
    }

    // Increment counter
    state.requests++;
    return true;
  }

  /**
   * Get remaining requests
   */
  getRemaining(apiName: keyof typeof RATE_LIMITS): number {
    const config = RATE_LIMITS[apiName];
    if (!config) return Infinity;

    const state = this.limiters.get(apiName);
    if (!state) return config.requests;

    return Math.max(0, config.requests - state.requests);
  }

  /**
   * Get time until reset (in milliseconds)
   */
  getTimeToReset(apiName: keyof typeof RATE_LIMITS): number {
    const config = RATE_LIMITS[apiName];
    if (!config) return 0;

    const state = this.limiters.get(apiName);
    if (!state) return 0;

    const elapsed = Date.now() - state.windowStart;
    return Math.max(0, config.window - elapsed);
  }

  /**
   * Reset limits for an API
   */
  reset(apiName: keyof typeof RATE_LIMITS): void {
    this.limiters.delete(apiName);
  }

  /**
   * Reset all limits
   */
  resetAll(): void {
    this.limiters.clear();
  }

  /**
   * Get stats for all rate limiters
   */
  getStats() {
    const stats: Record<string, any> = {};

    for (const [apiName, state] of this.limiters.entries()) {
      const config = RATE_LIMITS[apiName as keyof typeof RATE_LIMITS];
      stats[apiName] = {
        requests: state.requests,
        limit: config?.requests,
        blocked: state.blocked,
        timeToReset: this.getTimeToReset(apiName as keyof typeof RATE_LIMITS)
      };
    }

    return stats;
  }
};

export const rateLimiterService = new RateLimiterService();
