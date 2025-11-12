import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes

interface WeatherData {
  gameId: string;
  temperature: number;
  feelsLike: number;
  humidity: number;
  windSpeed: number;
  windDirection: number;
  precipitation: number;
  precipChance: number;
  conditions: string;
  weatherCode: number;
  visibility: number;
  pressure: number;
  forecast: {
    temp: number;
    wind: number;
    precip: number;
  }[];
  impactScore: number;
  lastUpdated: Date;
}

interface VenueCoordinates {
  city: string;
  state?: string;
  lat: number;
  lon: number;
}

// Major stadium coordinates (pre-defined for faster lookup)
const VENUE_COORDINATES: Record<string, VenueCoordinates> = {
  // NFL Stadiums
  'lambeau field': { city: 'Green Bay', state: 'WI', lat: 44.5013, lon: -88.0622 },
  'soldier field': { city: 'Chicago', state: 'IL', lat: 41.8623, lon: -87.6167 },
  'arrowhead stadium': { city: 'Kansas City', state: 'MO', lat: 39.0489, lon: -94.4839 },
  'highmark stadium': { city: 'Buffalo', state: 'NY', lat: 42.7738, lon: -78.7870 },
  'metlife stadium': { city: 'East Rutherford', state: 'NJ', lat: 40.8128, lon: -74.0742 },
  'gillette stadium': { city: 'Foxborough', state: 'MA', lat: 42.0909, lon: -71.2643 },
  'lincoln financial field': { city: 'Philadelphia', state: 'PA', lat: 39.9008, lon: -75.1675 },
  'at&t stadium': { city: 'Arlington', state: 'TX', lat: 32.7473, lon: -97.0945 },
  'sofi stadium': { city: 'Los Angeles', state: 'CA', lat: 33.9535, lon: -118.3391 },
  'lumen field': { city: 'Seattle', state: 'WA', lat: 47.5952, lon: -122.3316 },
  'empower field': { city: 'Denver', state: 'CO', lat: 39.7439, lon: -105.0201 },
  'allegiant stadium': { city: 'Las Vegas', state: 'NV', lat: 36.0909, lon: -115.1833 },
  'ford field': { city: 'Detroit', state: 'MI', lat: 42.3400, lon: -83.0456 },
  'us bank stadium': { city: 'Minneapolis', state: 'MN', lat: 44.9738, lon: -93.2577 },
  'mercedes-benz stadium': { city: 'Atlanta', state: 'GA', lat: 33.7553, lon: -84.4008 },
  'hard rock stadium': { city: 'Miami Gardens', state: 'FL', lat: 25.9580, lon: -80.2389 },
};

/**
 * Fetch weather data from OpenWeatherMap API
 */
async function fetchWeather(lat: number, lon: number): Promise<any> {
  const apiKey = process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY;

  if (!apiKey) {
    console.error('[Weather] OpenWeatherMap API key not configured');
    return null;
  }

  try {
    // Current weather + 5-day forecast
    const currentResponse = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=imperial`,
      { headers: { 'Accept': 'application/json' } }
    );

    const forecastResponse = await fetch(
      `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}&units=imperial`,
      { headers: { 'Accept': 'application/json' } }
    );

    if (!currentResponse.ok || !forecastResponse.ok) {
      console.error('[Weather] API error:', currentResponse.status, forecastResponse.status);
      return null;
    }

    const current = await currentResponse.json();
    const forecast = await forecastResponse.json();

    return { current, forecast };
  } catch (error) {
    console.error('[Weather] Error fetching weather:', error);
    return null;
  }
}

/**
 * Get venue coordinates (with geocoding fallback)
 */
async function getVenueCoordinates(venueName: string, city: string, state?: string): Promise<VenueCoordinates | null> {
  // Check pre-defined coordinates first
  const normalized = venueName.toLowerCase();
  if (VENUE_COORDINATES[normalized]) {
    return VENUE_COORDINATES[normalized];
  }

  // Geocode using OpenWeatherMap Geocoding API
  const apiKey = process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY;
  if (!apiKey) return null;

  try {
    const query = state ? `${city},${state},US` : `${city},US`;
    const response = await fetch(
      `http://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(query)}&limit=1&appid=${apiKey}`
    );

    if (!response.ok) return null;

    const data = await response.json();
    if (data.length > 0) {
      return {
        city,
        state,
        lat: data[0].lat,
        lon: data[0].lon,
      };
    }
  } catch (error) {
    console.error('[Weather] Geocoding error:', error);
  }

  return null;
}

/**
 * Calculate weather impact score (0-100)
 */
function calculateWeatherImpact(weather: any): number {
  let impact = 0;

  const temp = weather.current.main.temp;
  const wind = weather.current.wind.speed;
  const precip = weather.current.rain?.['1h'] || weather.current.snow?.['1h'] || 0;
  const conditions = weather.current.weather[0].main.toLowerCase();

  // Temperature impact
  if (temp < 20) impact += 30; // Extreme cold
  else if (temp < 32) impact += 20; // Freezing
  else if (temp > 95) impact += 15; // Extreme heat

  // Wind impact
  if (wind > 20) impact += 25; // Strong winds
  else if (wind > 15) impact += 15; // Moderate winds
  else if (wind > 10) impact += 5;

  // Precipitation impact
  if (precip > 0.5) impact += 20; // Heavy rain/snow
  else if (precip > 0.2) impact += 10; // Moderate precip

  // Condition impact
  if (conditions.includes('snow')) impact += 20;
  else if (conditions.includes('rain')) impact += 10;
  else if (conditions.includes('fog')) impact += 10;

  return Math.min(impact, 100);
}

/**
 * Collect weather for upcoming games
 */
async function collectWeatherData() {
  const results = {
    processed: 0,
    updated: 0,
    skipped: 0,
    errors: 0,
  };

  try {
    // Get games in next 7 days
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 7);

    const games = await prisma.game.findMany({
      where: {
        gameTime: {
          gte: startDate,
          lte: endDate,
        },
        status: 'scheduled',
      },
      select: {
        id: true,
        homeTeam: true,
        awayTeam: true,
        gameTime: true,
        externalId: true,
      },
    });

    console.log(`[Weather] Processing ${games.length} upcoming games`);

    for (const game of games) {
      results.processed++;

      try {
        // Fetch venue details from ESPN
        if (!game.externalId) {
          results.skipped++;
          continue;
        }

        // Get venue info (you'd need to store this in your Game model or fetch from ESPN)
        // For now, we'll try to geocode the home team's city
        const venueName = `${game.homeTeam} Stadium`;
        const cityMatch = game.homeTeam.match(/^([\w\s]+)/);
        const city = cityMatch ? cityMatch[1].trim() : game.homeTeam;

        const coordinates = await getVenueCoordinates(venueName, city);

        if (!coordinates) {
          console.log(`[Weather] Could not get coordinates for ${game.homeTeam}`);
          results.skipped++;
          continue;
        }

        // Fetch weather
        const weather = await fetchWeather(coordinates.lat, coordinates.lon);

        if (!weather) {
          results.errors++;
          continue;
        }

        // Calculate impact
        const impactScore = calculateWeatherImpact(weather);

        // Store in game metadata or create weather record
        // For now, we'll log it (you could add a Weather model to Prisma)
        console.log(`[Weather] ${game.awayTeam} @ ${game.homeTeam}:`, {
          temp: weather.current.main.temp,
          wind: weather.current.wind.speed,
          conditions: weather.current.weather[0].main,
          impact: impactScore,
        });

        results.updated++;

        // Rate limit: 60 calls/min on free tier
        await new Promise(resolve => setTimeout(resolve, 1100));
      } catch (error) {
        console.error(`[Weather] Error processing game ${game.id}:`, error);
        results.errors++;
      }
    }
  } catch (error) {
    console.error('[Weather] Error collecting weather data:', error);
  }

  return results;
}

/**
 * GET /api/cron/collect-weather
 * Cron endpoint for collecting weather data daily
 */
export async function GET(request: Request) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('[Cron] Starting weather collection:', new Date().toISOString());

    const results = await collectWeatherData();

    console.log('[Cron] Weather collection completed:', results);

    return NextResponse.json({
      success: true,
      message: 'Weather data collected',
      results,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[Cron] Error collecting weather:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to collect weather',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  return GET(request);
}
