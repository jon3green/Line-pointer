import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * Mark an alert as acted upon
 */
export async function POST(request: Request) {
  try {
    const { alertId, actedOn } = await request.json();

    const alert = await prisma.predictionAlert.update({
      where: { id: alertId },
      data: {
        actedOn: actedOn ?? true,
        actedOnAt: actedOn ? new Date() : null,
        viewed: true,
        viewedAt: new Date(),
      },
    });

    // Also update the related prediction
    if (actedOn) {
      await prisma.prediction.update({
        where: { id: alert.predictionId },
        data: {
          alertActedOn: true,
        },
      });
    }

    return NextResponse.json({ alert, success: true });
  } catch (error) {
    console.error('Error updating alert:', error);
    return NextResponse.json(
      { error: 'Failed to update alert' },
      { status: 500 }
    );
  }
}
