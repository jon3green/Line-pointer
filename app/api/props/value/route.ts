import { NextResponse } from 'next/server';
import { getAllPlayerProps } from '@/lib/api/player-props-odds';
import PropPredictions from '@/lib/ml/prop-predictions';

export const dynamic = 'force-dynamic';

/**
 * GET /api/props/value
 * 
 * Get all props with value indicators
 * 
 * Query parameters:
 * - sport: 'nfl' | 'ncaaf' (default: 'nfl')
 * - minValue: minimum value score to include (default: 0)
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const sport = (searchParams.get('sport') || 'nfl') as 'nfl' | 'ncaaf';
    const minValue = parseInt(searchParams.get('minValue') || '0');

    // Get all available props
    const propsData = await getAllPlayerProps(sport);

    if (!propsData.success) {
      return NextResponse.json({
        success: false,
        error: propsData.error || 'Failed to fetch props',
      }, { status: 500 });
    }

    if (propsData.props.length === 0) {
      return NextResponse.json({
        success: true,
        props: [],
        message: 'No props available at this time',
      });
    }

    // Transform and get value analysis
    const propsForML = propsData.props.map(p => ({
      playerId: p.playerId || p.playerName.replace(/\s+/g, '-').toLowerCase(),
      playerName: p.playerName,
      propType: p.propType,
      line: p.line,
      overOdds: p.overOdds,
      underOdds: p.underOdds,
    }));

    // Get value props
    const valueProps = await PropPredictions.findBestValueProps(propsForML, minValue);

    // Enhance original props with value data
    const enhancedProps = propsData.props.map(prop => {
      const valueProp = valueProps.find(
        vp => vp.prop.playerName === prop.playerName && vp.prop.propType === prop.propType
      );

      return {
        ...prop,
        value: valueProp ? {
          rating: valueProp.valueRating,
          score: valueProp.prop.prediction.valueScore,
          expectedROI: valueProp.expectedROI,
          confidence: valueProp.confidence,
          recommendation: valueProp.prop.prediction.recommendation,
          prediction: valueProp.prop.prediction,
          factors: valueProp.prop.factors,
        } : null,
      };
    });

    return NextResponse.json({
      success: true,
      count: enhancedProps.length,
      props: enhancedProps,
      valueCount: valueProps.length,
    });

  } catch (error) {
    console.error('Value props API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to analyze prop values',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

