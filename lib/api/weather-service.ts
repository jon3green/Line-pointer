/**
 * Weather Impact Service
 * Integrates with OpenWeatherMap API to analyze weather impact on games
 *
 * Free Tier: 1,000 calls/day
 * Documentation: https://openweathermap.org/api
 */

import axios from 'axios';
import { cacheWeather } from '@/lib/cache/redis';

const OPENWEATHER_API_KEY = process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY;
const OPENWEATHER_BASE = 'https://api.openweathermap.org/data/2.5';

interface WeatherData {
  temperature: number; // Fahrenheit
  feelsLike: number;
  windSpeed: number; // mph
  windDirection: string;
  precipitation: number; // inches
  humidity: number; // percentage
  conditions: string;
  visibility: number; // miles
}

interface WeatherImpact {
  score: number; // -10 to +10 (negative = harder scoring)
  factors: {
    temperature: number;
    wind: number;
    precipitation: number;
    overall: string;
  };
  recommendation: string;
}

// NFL Stadium coordinates
const STADIUM_LOCATIONS: Record<string, { lat: number; lon: number; isDome: boolean }> = {
  // AFC East
  'BUF': { lat: 42.7738, lon: -78.7870, isDome: false }, // Buffalo
  'MIA': { lat: 25.9580, lon: -80.2389, isDome: false }, // Miami
  'NE': { lat: 42.0909, lon: -71.2643, isDome: false }, // New England
  'NYJ': { lat: 40.8128, lon: -74.0742, isDome: false }, // New York Jets
  
  // AFC North  
  'BAL': { lat: 39.2780, lon: -76.6227, isDome: false }, // Baltimore
  'CIN': { lat: 39.0954, lon: -84.5160, isDome: false }, // Cincinnati
  'CLE': { lat: 41.5061, lon: -81.6995, isDome: false }, // Cleveland
  'PIT': { lat: 40.4468, lon: -80.0158, isDome: false }, // Pittsburgh
  
  // AFC South
  'HOU': { lat: 29.6847, lon: -95.4107, isDome: true }, // Houston (retractable)
  'IND': { lat: 39.7601, lon: -86.1639, isDome: true }, // Indianapolis
  'JAX': { lat: 30.3239, lon: -81.6373, isDome: false }, // Jacksonville
  'TEN': { lat: 36.1665, lon: -86.7713, isDome: false }, // Tennessee
  
  // AFC West
  'DEN': { lat: 39.7439, lon: -105.0201, isDome: false }, // Denver
  'KC': { lat: 39.0489, lon: -94.4839, isDome: false }, // Kansas City
  'LV': { lat: 36.0908, lon: -115.1836, isDome: true }, // Las Vegas
  'LAC': { lat: 33.8649, lon: -118.3393, isDome: false }, // LA Chargers
  
  // NFC East
  'DAL': { lat: 32.7473, lon: -97.0945, isDome: true }, // Dallas
  'NYG': { lat: 40.8128, lon: -74.0742, isDome: false }, // New York Giants
  'PHI': { lat: 39.9008, lon: -75.1675, isDome: false }, // Philadelphia
  'WAS': { lat: 38.9076, lon: -76.8645, isDome: false }, // Washington
  
  // NFC North
  'CHI': { lat: 41.8623, lon: -87.6167, isDome: false }, // Chicago
  'DET': { lat: 42.3400, lon: -83.0456, isDome: true }, // Detroit
  'GB': { lat: 44.5013, lon: -88.0622, isDome: false }, // Green Bay
  'MIN': { lat: 44.9738, lon: -93.2580, isDome: true }, // Minnesota
  
  // NFC South
  'ATL': { lat: 42.9634, lon: -85.6681, isDome: true }, // Atlanta
  'CAR': { lat: 35.2258, lon: -80.8529, isDome: false }, // Carolina
  'NO': { lat: 29.9511, lon: -90.0812, isDome: true }, // New Orleans
  'TB': { lat: 27.9759, lon: -82.5033, isDome: false }, // Tampa Bay
  
  // NFC West
  'ARI': { lat: 33.5276, lon: -112.2626, isDome: true }, // Arizona
  'LA': { lat: 34.0140, lon: -118.2880, isDome: false }, // LA Rams
  'SF': { lat: 37.4030, lon: -121.9700, isDome: false }, // San Francisco
  'SEA': { lat: 47.5952, lon: -122.3316, isDome: false }, // Seattle
};

/**
 * Fetch weather data from OpenWeatherMap
 */
export async function fetchWeather(
  teamAbbreviation: string,
  gameDate: Date
): Promise<WeatherData | null> {
  const API_KEY = process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY;
  
  if (!API_KEY) {
    console.warn('OpenWeatherMap API key not configured');
    return generateMockWeather(); // Fallback to mock data
  }
  
  const stadium = STADIUM_LOCATIONS[teamAbbreviation];
  if (!stadium) {
    console.warn(`Stadium location not found for ${teamAbbreviation}`);
    return null;
  }
  
  // If dome stadium, weather doesn't matter
  if (stadium.isDome) {
    return {
      temperature: 72,
      feelsLike: 72,
      windSpeed: 0,
      windDirection: 'N',
      precipitation: 0,
      humidity: 50,
      conditions: 'Indoor',
      visibility: 10,
    };
  }
  
  try {
    // Use forecast API for future games
    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/forecast?lat=${stadium.lat}&lon=${stadium.lon}&appid=${API_KEY}&units=imperial`
    );
    
    if (!response.ok) {
      throw new Error(`Weather API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Find forecast closest to game time
    const gameForecast = data.list[0]; // Use nearest forecast for demo
    
    return {
      temperature: gameForecast.main.temp,
      feelsLike: gameForecast.main.feels_like,
      windSpeed: gameForecast.wind.speed,
      windDirection: degreesToCardinal(gameForecast.wind.deg),
      precipitation: gameForecast.rain?.['3h'] || 0,
      humidity: gameForecast.main.humidity,
      conditions: gameForecast.weather[0].description,
      visibility: gameForecast.visibility / 1609, // Convert meters to miles
    };
  } catch (error) {
    console.error('Error fetching weather:', error);
    return generateMockWeather();
  }
}

/**
 * Calculate weather impact on game scoring
 */
export function calculateWeatherImpact(weather: WeatherData | null): WeatherImpact {
  if (!weather || weather.conditions === 'Indoor') {
    return {
      score: 0,
      factors: {
        temperature: 0,
        wind: 0,
        precipitation: 0,
        overall: 'No weather impact (indoor)',
      },
      recommendation: 'Standard game conditions',
    };
  }
  
  let tempImpact = 0;
  let windImpact = 0;
  let precipImpact = 0;
  
  // Temperature impact (extreme temps reduce scoring)
  if (weather.temperature < 20) {
    tempImpact = -4; // Frigid
  } else if (weather.temperature < 32) {
    tempImpact = -2.5; // Freezing
  } else if (weather.temperature < 40) {
    tempImpact = -1; // Very cold
  } else if (weather.temperature > 95) {
    tempImpact = -1.5; // Very hot
  }
  
  // Wind impact (passing game affected most)
  if (weather.windSpeed > 25) {
    windImpact = -5; // Severe wind
  } else if (weather.windSpeed > 20) {
    windImpact = -3.5; // Strong wind
  } else if (weather.windSpeed > 15) {
    windImpact = -2; // Moderate wind
  } else if (weather.windSpeed > 10) {
    windImpact = -0.5; // Light wind
  }
  
  // Precipitation impact
  if (weather.precipitation > 0.5) {
    precipImpact = -4; // Heavy rain
  } else if (weather.precipitation > 0.2) {
    precipImpact = -2.5; // Moderate rain
  } else if (weather.precipitation > 0) {
    precipImpact = -1; // Light rain
  }
  
  const totalImpact = tempImpact + windImpact + precipImpact;
  
  let overall = 'Ideal conditions';
  let recommendation = 'No significant weather concerns';
  
  if (totalImpact < -8) {
    overall = 'Severe weather impact';
    recommendation = 'Consider UNDER. Passing game severely limited. Favor run-heavy teams.';
  } else if (totalImpact < -5) {
    overall = 'Significant weather impact';
    recommendation = 'Lean UNDER. Weather will reduce scoring. Favor strong defenses.';
  } else if (totalImpact < -3) {
    overall = 'Moderate weather impact';
    recommendation = 'Slight UNDER tendency. Weather may limit big plays.';
  } else if (totalImpact < -1) {
    overall = 'Minor weather impact';
    recommendation = 'Weather may slightly impact passing game.';
  }
  
  return {
    score: totalImpact,
    factors: {
      temperature: tempImpact,
      wind: windImpact,
      precipitation: precipImpact,
      overall,
    },
    recommendation,
  };
}

/**
 * Get weather-adjusted total (over/under)
 */
export function getWeatherAdjustedTotal(
  originalTotal: number,
  weather: WeatherData | null
): number {
  const impact = calculateWeatherImpact(weather);
  return originalTotal + impact.score;
}

// Helper functions

function degreesToCardinal(degrees: number): string {
  const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  const index = Math.round(degrees / 45) % 8;
  return directions[index];
}

function generateMockWeather(): WeatherData {
  return {
    temperature: 65 + Math.random() * 20,
    feelsLike: 65 + Math.random() * 20,
    windSpeed: Math.random() * 15,
    windDirection: ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'][Math.floor(Math.random() * 8)],
    precipitation: Math.random() < 0.2 ? Math.random() * 0.5 : 0,
    humidity: 40 + Math.random() * 40,
    conditions: ['Clear', 'Partly Cloudy', 'Cloudy'][Math.floor(Math.random() * 3)],
    visibility: 8 + Math.random() * 2,
  };
}

/**
 * Check if weather is a significant factor for betting
 */
export function isWeatherSignificant(weather: WeatherData | null): boolean {
  if (!weather || weather.conditions === 'Indoor') return false;
  
  const impact = calculateWeatherImpact(weather);
  return impact.score < -2; // Significant if impact is -2 or worse
}

