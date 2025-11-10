import { NextResponse } from 'next/server';
import { generateMLPrediction } from '@/lib/api/ml-predictions';
import { fetchGames } from '@/lib/api/sports-data';

export async function POST(request: Request) {
  try {
    const { gameId } = await request.json();
    
    if (!gameId) {
      return NextResponse.json(
        { error: 'gameId is required', success: false },
        { status: 400 }
      );
    }
    
    // Fetch the game data
    const games = await fetchGames();
    const game = games.find(g => g.id === gameId);
    
    if (!game) {
      return NextResponse.json(
        { error: 'Game not found', success: false },
        { status: 404 }
      );
    }
    
    // Generate ML prediction
    const prediction = await generateMLPrediction(game);
    
    return NextResponse.json({ prediction, success: true });
  } catch (error) {
    console.error('Error generating prediction:', error);
    return NextResponse.json(
      { error: 'Failed to generate prediction', success: false },
      { status: 500 }
    );
  }
}

