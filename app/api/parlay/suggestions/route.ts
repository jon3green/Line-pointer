import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { generateParlaysuggestions } from '@/lib/services/parlay-optimizer';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/**
 * GET - Generate AI-optimized parlay suggestions
 * Returns parlays with high EV and low correlation
 */
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const sport = searchParams.get('sport') || 'NFL';
    const numLegs = parseInt(searchParams.get('numLegs') || '3');
    const minConfidence = parseInt(searchParams.get('minConfidence') || '70');
    const count = parseInt(searchParams.get('count') || '5');

    // Validate parameters
    if (numLegs < 2 || numLegs > 10) {
      return NextResponse.json(
        { error: 'numLegs must be between 2 and 10' },
        { status: 400 }
      );
    }

    // Get upcoming games with predictions
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const predictions = await prisma.prediction.findMany({
      where: {
        sport,
        confidence: { gte: minConfidence },
        gameTime: {
          gte: now,
          lte: tomorrow,
        },
      },
      include: {
        game: {
          select: {
            homeTeam: true,
            awayTeam: true,
            gameTime: true,
          },
        },
      },
      orderBy: { confidence: 'desc' },
      take: 50, // Get top 50 to build combinations from
    });

    if (predictions.length < numLegs) {
      return NextResponse.json({
        success: true,
        suggestions: [],
        message: `Not enough predictions (${predictions.length}) to build ${numLegs}-leg parlays`,
      });
    }

    // Generate parlay suggestions
    const suggestions = await generateParlaysuggestions(
      predictions,
      numLegs,
      count
    );

    return NextResponse.json({
      success: true,
      suggestions,
      params: { sport, numLegs, minConfidence, count },
    });
  } catch (error) {
    console.error('[Parlay] Suggestions error:', error);
    return NextResponse.json({ error: 'Failed to generate suggestions' }, { status: 500 });
  }
}
