import { API_CONFIG, CACHE_CONFIG } from '../config/api.config';
import { cacheService } from './cache.service';
import { rateLimiterService } from './rateLimiter.service';

// Type definitions
interface WeatherData {
  temp: number;
  feels_like: number;
  humidity: number;
  wind_speed: number;
  wind_deg: number;
  weather: {
    main: string;
    description: string;
  }[];
  pop?: number;
};

interface GameWeather {
  gameId: string;
  location: {
    lat: number;
    lon: number;
    city: string;
    stadium: string;
  };
  forecast: WeatherData;
  impact: 'high' | 'medium' | 'low' | 'none';
  analysis: string;
};

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code: string;
    details?: any;
  };
  cached: boolean;
  timestamp: string;
};

// Stadium locations database
const STADIUM_LOCATIONS: Record<string, { lat: number; lon: number; city: string; indoor: boolean }> = {
  // NFL Stadiums
  'Arrowhead Stadium': { lat: 39.0489, lon: -94.4839, city: 'Kansas City, MO', indoor: false },
  'Levi\'s Stadium': { lat: 37.4032, lon: -121.9698, city: 'Santa Clara, CA', indoor: false },
  'Ford Field': { lat: 42.3400, lon: -83.0456, city: 'Detroit, MI', indoor: true },
  'AT&T Stadium': { lat: 32.7473, lon: -97.0945, city: 'Arlington, TX', indoor: true },
  'MetLife Stadium': { lat: 40.8128, lon: -74.0742, city: 'East Rutherford, NJ', indoor: false },
  'Lambeau Field': { lat: 44.5013, lon: -88.0622, city: 'Green Bay, WI', indoor: false },

  // NCAAF Stadiums
  'Sanford Stadium': { lat: 33.9495, lon: -83.3732, city: 'Athens, GA', indoor: false },
  'Ohio Stadium': { lat: 40.0018, lon: -83.0198, city: 'Columbus, OH', indoor: false },
  'Darrell K Royal Stadium': { lat: 30.2839, lon: -97.7325, city: 'Austin, TX', indoor: false },
  'Memorial Stadium': { lat: 40.8202, lon: -96.7046, city: 'Lincoln, NE', indoor: false },
  'Bryant-Denny Stadium': { lat: 33.2080, lon: -87.5502, city: 'Tuscaloosa, AL', indoor: false }
};;

class WeatherService {
  private baseUrl = API_CONFIG.openWeather.baseUrl;
  private apiKey = API_CONFIG.openWeather.apiKey;

  /**
   * Get weather for a stadium
   */
  async getStadiumWeather(stadium: string, gameTime: string): Promise<ApiResponse<GameWeather>> {
    const location = STADIUM_LOCATIONS[stadium];

    if (!location) {
      return {
        success: false,
        error: {
          message: `Stadium location not found: ${stadium}`,
          code: 'STADIUM_NOT_FOUND'
        },
        cached: false,
        timestamp: new Date().toISOString()
      };
    }

    // Indoor stadiums don't need weather
    if (location.indoor) {
      return {
        success: true,
        data: {
          gameId: '',
          location: {
            ...location,
            stadium
          },
          forecast: {
            temp: 72,
            feels_like: 72,
            humidity: 50,
            wind_speed: 0,
            wind_deg: 0,
            weather: [{ main: 'Clear', description: 'Indoor - Controlled environment' }]
          },
          impact: 'none',
          analysis: 'Indoor stadium - weather has no impact on game conditions.'
        },
        cached: false,
        timestamp: new Date().toISOString()
      };
    }

    const cacheKey = `weather_${stadium}_${gameTime}`;

    // Check cache
    const cached = cacheService.get<GameWeather>(cacheKey);
    if (cached) {
      return {
        success: true,
        data: cached,
        cached: true,
        timestamp: new Date().toISOString()
      };
    }

    // Check rate limit
    const allowed = await rateLimiterService.checkLimit('openWeather');
    if (!allowed) {
      return {
        success: false,
        error: {
          message: 'Rate limit exceeded',
          code: 'RATE_LIMIT_EXCEEDED'
        },
        cached: false,
        timestamp: new Date().toISOString()
      };
    }

    try {
      // Use forecast API for future games
      const url = `${this.baseUrl}/forecast?` + new URLSearchParams({
        lat: location.lat.toString(),
        lon: location.lon.toString(),
        appid: this.apiKey,
        units: 'imperial'
      });

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Weather API error: ${response.status}`);
      }

      const data = await response.json();

      // Find forecast closest to game time
      const gameDate = new Date(gameTime);
      const forecast = this.findClosestForecast(data.list, gameDate);

      const weather: GameWeather = {
        gameId: '',
        location: {
          ...location,
          stadium
        },
        forecast: forecast.main ? {
          temp: forecast.main.temp,
          feels_like: forecast.main.feels_like,
          humidity: forecast.main.humidity,
          wind_speed: forecast.wind.speed,
          wind_deg: forecast.wind.deg,
          weather: forecast.weather,
          pop: forecast.pop
        } : {
          temp: 72,
          feels_like: 72,
          humidity: 50,
          wind_speed: 5,
          wind_deg: 0,
          weather: [{ main: 'Clear', description: 'clear sky' }]
        },
        impact: this.calculateWeatherImpact(forecast),
        analysis: this.generateWeatherAnalysis(forecast)
      };

      // Cache result
      cacheService.set(cacheKey, weather, CACHE_CONFIG.weatherCache);

      return {
        success: true,
        data: weather,
        cached: false,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error fetching weather:', error);
      return {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Unknown error',
          code: 'FETCH_ERROR'
        },
        cached: false,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Find forecast entry closest to game time
   */
  private findClosestForecast(forecasts: any[], gameDate: Date) {
    let closest = forecasts[0];
    let minDiff = Math.abs(new Date(closest.dt * 1000).getTime() - gameDate.getTime());

    forecasts.forEach(forecast => {
      const diff = Math.abs(new Date(forecast.dt * 1000).getTime() - gameDate.getTime());
      if (diff < minDiff) {
        minDiff = diff;
        closest = forecast;
      }
    });

    return closest;
  }

  /**
   * Calculate weather impact on game
   */
  private calculateWeatherImpact(forecast: any): 'high' | 'medium' | 'low' | 'none' {
    if (!forecast.main) return 'none';

    const windSpeed = forecast.wind?.speed || 0;
    const temp = forecast.main.temp;
    const precipitation = forecast.pop || 0;
    const condition = forecast.weather?.[0]?.main || 'Clear';

    // High impact conditions
    if (windSpeed > 20 || temp < 20 || temp > 95 || precipitation > 0.7 ||
        condition === 'Snow' || condition === 'Thunderstorm') {
      return 'high';
    }

    // Medium impact conditions
    if (windSpeed > 12 || temp < 32 || temp > 85 || precipitation > 0.4 ||
        condition === 'Rain') {
      return 'medium';
    }

    // Low impact conditions
    if (windSpeed > 8 || precipitation > 0.2) {
      return 'low';
    }

    return 'none';
  }

  /**
   * Generate weather analysis text
   */
  private generateWeatherAnalysis(forecast: any): string {
    if (!forecast.main) return 'Weather data unavailable.';

    const windSpeed = forecast.wind?.speed || 0;
    const temp = forecast.main.temp;
    const condition = forecast.weather?.[0]?.description || 'clear';
    const precipitation = (forecast.pop || 0) * 100;

    let analysis = `${temp.toFixed(0)}°F with ${condition}. `;

    if (windSpeed > 15) {
      analysis += `Strong winds (${windSpeed.toFixed(0)} mph) will significantly affect passing game and field goals. `;
    } else if (windSpeed > 10) {
      analysis += `Moderate winds (${windSpeed.toFixed(0)} mph) may impact deep passes. `;
    }

    if (precipitation > 50) {
      analysis += `High chance of precipitation (${precipitation.toFixed(0)}%) - expect more rushing attempts. `;
    }

    if (temp < 25) {
      analysis += 'Extremely cold conditions favor physical, run-heavy gameplay.';
    } else if (temp < 40) {
      analysis += 'Cold weather may reduce passing efficiency.';
    } else if (temp > 85) {
      analysis += 'Hot conditions may lead to more fatigue and substitutions.';
    } else {
      analysis += 'Conditions are favorable for all aspects of play.';
    }

    return analysis;
  }

  /**
   * Get all supported stadiums
   */
  getStadiums(): string[] {
    return Object.keys(STADIUM_LOCATIONS);
  }

  /**
   * Check if stadium is indoor
   */
  isIndoorStadium(stadium: string): boolean {
    return STADIUM_LOCATIONS[stadium]?.indoor || false;
  }
};

export const weatherService = new WeatherService();
