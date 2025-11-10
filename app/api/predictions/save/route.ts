import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      gameId,
      externalGameId,
      sport,
      homeTeam,
      awayTeam,
      gameTime,
      predictedWinner,
      confidence,
      predictedSpread,
      predictedTotal,
      spreadPick,
      totalPick,
      moneylinePick,
      modelVersion,
      factors,
    } = body;

    // Check if prediction already exists
    const existing = await prisma.prediction.findFirst({
      where: {
        gameId,
        modelVersion: modelVersion || 'v1.0',
      },
    });

    if (existing) {
      // Update existing prediction
      const updated = await prisma.prediction.update({
        where: { id: existing.id },
        data: {
          confidence,
          predictedSpread,
          predictedTotal,
          spreadPick,
          totalPick,
          moneylinePick,
          factors: factors ? JSON.stringify(factors) : null,
          updatedAt: new Date(),
        },
      });

      return NextResponse.json({ prediction: updated, updated: true });
    }

    // Create new prediction
    const prediction = await prisma.prediction.create({
      data: {
        gameId,
        externalGameId,
        sport,
        homeTeam,
        awayTeam,
        gameTime: new Date(gameTime),
        predictedWinner,
        confidence,
        predictedSpread,
        predictedTotal,
        spreadPick,
        totalPick,
        moneylinePick,
        modelVersion: modelVersion || 'v1.0',
        factors: factors ? JSON.stringify(factors) : null,
      },
    });

    // Create alert if high confidence (>= 70%)
    if (confidence >= 70) {
      await prisma.predictionAlert.create({
        data: {
          predictionId: prediction.id,
          type: confidence >= 85 ? 'high_confidence' : 'value_bet',
          title: `${confidence >= 85 ? '🔥' : '💎'} ${confidence.toFixed(1)}% Confidence Pick`,
          message: `${homeTeam} vs ${awayTeam}: ${spreadPick || moneylinePick || 'Check analysis'}`,
          confidence,
          sport,
          homeTeam,
          awayTeam,
          gameTime: new Date(gameTime),
          pick: spreadPick || moneylinePick || totalPick || '',
        },
      });
    }

    return NextResponse.json({ prediction, created: true });
  } catch (error) {
    console.error('Error saving prediction:', error);
    return NextResponse.json(
      { error: 'Failed to save prediction' },
      { status: 500 }
    );
  }
}
