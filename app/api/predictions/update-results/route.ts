import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * Fetch game results from ESPN and update predictions
 * This runs automatically via cron or manually triggered
 */
export async function POST(request: Request) {
  try {
    // Get all predictions that don't have results yet
    const pendingPredictions = await prisma.prediction.findMany({
      where: {
        actualWinner: null,
        gameTime: {
          lt: new Date(), // Game has already started/ended
        },
      },
      orderBy: {
        gameTime: 'desc',
      },
      take: 100, // Process 100 at a time
    });

    if (pendingPredictions.length === 0) {
      return NextResponse.json({ message: 'No pending predictions to update', updated: 0 });
    }

    const updates = [];

    // Fetch results for each prediction
    for (const prediction of pendingPredictions) {
      try {
        // Fetch game result from ESPN API
        if (!prediction.externalGameId) continue;

        const espnUrl = `https://site.api.espn.com/apis/site/v2/sports/football/${
          prediction.sport === 'NFL' ? 'nfl' : 'college-football'
        }/scoreboard/${prediction.externalGameId}`;

        const response = await fetch(espnUrl);
        const data = await response.json();

        if (data.competitions && data.competitions[0]) {
          const competition = data.competitions[0];
          const status = competition.status?.type?.name;

          // Only update if game is final
          if (status !== 'STATUS_FINAL') continue;

          const homeCompetitor = competition.competitors.find(
            (c: any) => c.homeAway === 'home'
          );
          const awayCompetitor = competition.competitors.find(
            (c: any) => c.homeAway === 'away'
          );

          if (!homeCompetitor || !awayCompetitor) continue;

          const homeScore = parseInt(homeCompetitor.score || '0');
          const awayScore = parseInt(awayCompetitor.score || '0');
          const actualWinner = homeScore > awayScore ? 'home' : 'away';
          const actualSpread = homeScore - awayScore;
          const actualTotal = homeScore + awayScore;

          // Calculate correctness
          const wasCorrect = prediction.predictedWinner === actualWinner;
          const spreadCorrect = prediction.predictedSpread
            ? Math.abs((prediction.predictedSpread || 0) - actualSpread) <= 3
            : null;
          const totalCorrect = prediction.predictedTotal
            ? Math.abs((prediction.predictedTotal || 0) - actualTotal) <= 5
            : null;

          // Update prediction with results
          await prisma.prediction.update({
            where: { id: prediction.id },
            data: {
              homeScore,
              awayScore,
              actualWinner,
              actualSpread,
              actualTotal,
              wasCorrect,
              spreadCorrect,
              totalCorrect,
              moneylineCorrect: wasCorrect,
              resultsFetchedAt: new Date(),
            },
          });

          // Update related alert if exists
          const alert = await prisma.predictionAlert.findFirst({
            where: { predictionId: prediction.id },
          });

          if (alert && alert.actedOn) {
            await prisma.predictionAlert.update({
              where: { id: alert.id },
              data: {
                outcome: wasCorrect ? 'won' : 'lost',
              },
            });
          }

          updates.push({
            gameId: prediction.gameId,
            wasCorrect,
            homeScore,
            awayScore,
          });
        }
      } catch (error) {
        console.error(`Error updating prediction ${prediction.id}:`, error);
      }
    }

    return NextResponse.json({
      message: `Updated ${updates.length} predictions`,
      updated: updates.length,
      results: updates,
    });
  } catch (error) {
    console.error('Error updating prediction results:', error);
    return NextResponse.json(
      { error: 'Failed to update results' },
      { status: 500 }
    );
  }
}
