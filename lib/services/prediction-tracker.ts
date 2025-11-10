/**
 * Prediction Tracker Service
 * Automatically saves predictions for all games and tracks results
 */

import { prisma } from '../prisma';
import type { Game } from '../types';

export interface PredictionInput {
  game: Game;
  modelVersion?: string;
}

/**
 * Save a prediction for a game
 */
export async function savePrediction(input: PredictionInput) {
  const { game, modelVersion = 'v1.0' } = input;

  if (!game.prediction) {
    console.warn(`No prediction available for game ${game.id}`);
    return null;
  }

  try {
    // Check if prediction already exists
    const existing = await prisma.prediction.findFirst({
      where: {
        gameId: game.id,
        modelVersion,
      },
    });

    const predictionData = {
      gameId: game.id,
      externalGameId: game.id,
      sport: game.league,
      homeTeam: game.homeTeam.name,
      awayTeam: game.awayTeam.name,
      gameTime: new Date(game.date),
      predictedWinner: game.prediction.winner,
      confidence: game.prediction.confidence,
      predictedSpread: game.prediction.predictedScore?.home && game.prediction.predictedScore?.away
        ? game.prediction.predictedScore.home - game.prediction.predictedScore.away
        : null,
      predictedTotal: game.prediction.predictedScore?.home && game.prediction.predictedScore?.away
        ? game.prediction.predictedScore.home + game.prediction.predictedScore.away
        : null,
      spreadPick: game.odds?.spread
        ? `${game.prediction.winner === 'home' ? game.homeTeam.abbreviation : game.awayTeam.abbreviation} ${
            game.prediction.winner === 'home' ? game.odds.spread.home : game.odds.spread.away
          }`
        : null,
      totalPick: game.odds?.total ? `${game.prediction.winner === 'home' ? 'Over' : 'Under'} ${game.odds.total.line}` : null,
      moneylinePick: `${game.prediction.winner === 'home' ? game.homeTeam.abbreviation : game.awayTeam.abbreviation} ML`,
      modelVersion,
      factors: game.prediction.factors ? JSON.stringify(game.prediction.factors) : null,
    };

    if (existing) {
      // Update existing prediction
      const updated = await prisma.prediction.update({
        where: { id: existing.id },
        data: {
          ...predictionData,
          updatedAt: new Date(),
        },
      });
      return updated;
    }

    // Create new prediction
    const prediction = await prisma.prediction.create({
      data: predictionData,
    });

    // Create alert if high confidence (>= 70%)
    if (game.prediction.confidence >= 70) {
      await prisma.predictionAlert.create({
        data: {
          predictionId: prediction.id,
          type: game.prediction.confidence >= 85 ? 'high_confidence' : 'value_bet',
          title: `${game.prediction.confidence >= 85 ? '🔥' : '💎'} ${game.prediction.confidence.toFixed(1)}% Confidence`,
          message: `${game.homeTeam.name} vs ${game.awayTeam.name}: ${predictionData.spreadPick || predictionData.moneylinePick}`,
          confidence: game.prediction.confidence,
          sport: game.league,
          homeTeam: game.homeTeam.name,
          awayTeam: game.awayTeam.name,
          gameTime: new Date(game.date),
          pick: predictionData.spreadPick || predictionData.moneylinePick || '',
        },
      });
    }

    return prediction;
  } catch (error) {
    console.error('Error saving prediction:', error);
    return null;
  }
}

/**
 * Save predictions for multiple games
 */
export async function savePredictions(games: Game[], modelVersion = 'v1.0') {
  const results = [];

  for (const game of games) {
    const prediction = await savePrediction({ game, modelVersion });
    if (prediction) {
      results.push(prediction);
    }
  }

  return results;
}

/**
 * Update results for completed games
 */
export async function updateGameResults(gameId: string, externalGameId: string) {
  try {
    const prediction = await prisma.prediction.findFirst({
      where: {
        OR: [{ gameId }, { externalGameId }],
        actualWinner: null, // Not yet updated
      },
    });

    if (!prediction) return null;

    // Fetch result from ESPN
    const espnUrl = `https://site.api.espn.com/apis/site/v2/sports/football/${
      prediction.sport === 'NFL' ? 'nfl' : 'college-football'
    }/scoreboard/${externalGameId}`;

    const response = await fetch(espnUrl);
    const data = await response.json();

    if (!data.competitions?.[0]) return null;

    const competition = data.competitions[0];
    const status = competition.status?.type?.name;

    if (status !== 'STATUS_FINAL') return null;

    const homeCompetitor = competition.competitors.find((c: any) => c.homeAway === 'home');
    const awayCompetitor = competition.competitors.find((c: any) => c.homeAway === 'away');

    if (!homeCompetitor || !awayCompetitor) return null;

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

    // Update prediction
    const updated = await prisma.prediction.update({
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

    // Update related alert
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

    return updated;
  } catch (error) {
    console.error('Error updating game results:', error);
    return null;
  }
}
