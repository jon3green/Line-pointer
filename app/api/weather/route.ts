import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const location = searchParams.get('location') || 'Kansas City';

    const apiKey = process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json({ error: 'Weather service not configured' }, { status: 500 });
    }

    const url = `https://api.openweathermap.org/data/2.5/weather?q=${location}&appid=${apiKey}&units=imperial`;
    const response = await fetch(url);
    
    if (!response.ok) {
      return NextResponse.json({ error: 'Failed to fetch weather' }, { status: response.status });
    }

    const data = await response.json();

    return NextResponse.json({
      success: true,
      weather: {
        location: data.name,
        temperature: Math.round(data.main.temp),
        condition: data.weather[0].main,
        description: data.weather[0].description,
        windSpeed: Math.round(data.wind.speed),
        humidity: data.main.humidity,
      },
    });
  } catch (error) {
    console.error('Weather API error:', error);
    return NextResponse.json({ error: 'Failed to fetch weather data' }, { status: 500 });
  }
}
