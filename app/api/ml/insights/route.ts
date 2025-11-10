import { NextResponse } from 'next/server';
import { generateMLInsights, calculateMLAdjustments } from '@/lib/ml/learning-engine';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const daysBack = Number(searchParams.get('days')) || 30;
    const sport = searchParams.get('sport') || undefined;

    const insights = await generateMLInsights(daysBack);
    const adjustments = await calculateMLAdjustments(sport, daysBack);

    return NextResponse.json({
      insights,
      adjustments,
      success: true,
    });
  } catch (error) {
    console.error('Error generating ML insights:', error);
    return NextResponse.json(
      { error: 'Failed to generate ML insights', success: false },
      { status: 500 }
    );
  }
}
