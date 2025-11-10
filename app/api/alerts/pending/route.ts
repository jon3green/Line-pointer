import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');

    // Get pending alerts (not viewed or acted on)
    const alerts = await prisma.predictionAlert.findMany({
      where: {
        gameTime: {
          gte: new Date(), // Only future games
        },
      },
      orderBy: [
        { confidence: 'desc' },
        { gameTime: 'asc' },
      ],
      take: limit,
    });

    return NextResponse.json({ alerts, count: alerts.length });
  } catch (error) {
    console.error('Error fetching alerts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch alerts' },
      { status: 500 }
    );
  }
}
