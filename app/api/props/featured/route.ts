export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getAllPlayerProps } from '@/lib/api/player-props-odds';
import PropPredictions from '@/lib/ml/prop-predictions';

/**
 * GET /api/props/featured
 * 
 * Get featured props with best value and high confidence
 * 
 * Query parameters:
 * - sport: 'nfl' | 'ncaaf' (default: 'nfl')
 * - minValue: minimum value score (default: 8)
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const sport = (searchParams.get('sport') || 'nfl') as 'nfl' | 'ncaaf';
    const minValue = parseInt(searchParams.get('minValue') || '8');

    // Get all available props
    const propsData = await getAllPlayerProps(sport);

    if (!propsData.success || propsData.props.length === 0) {
      return NextResponse.json({
        success: true,
        featured: [],
        message: 'No props available at this time',
      });
    }

    // Transform to format needed by ML model
    const propsForML = propsData.props.map(p => ({
      playerId: p.playerId || p.playerName.replace(/\s+/g, '-').toLowerCase(),
      playerName: p.playerName,
      propType: p.propType,
      line: p.line,
      overOdds: p.overOdds,
      underOdds: p.underOdds,
    }));

    // Get featured props
    const featured = await PropPredictions.getFeaturedProps(propsForML);

    return NextResponse.json({
      success: true,
      count: featured.length,
      featured,
    });

  } catch (error) {
    console.error('Featured props API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch featured props',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

