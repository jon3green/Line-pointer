import { prisma } from '@/lib/prisma';

/**
 * Player Props Predictor Service
 * Generates over/under predictions for player props
 */

export interface PropPredictionInput {
  playerId: string;
  playerName: string;
  team: string;
  position: string;
  gameId: string;
  opponent: string;
  gameTime: Date;
  propType: string;
  line: number;
  overOdds?: number;
  underOdds?: number;
}

export interface PropPredictionOutput {
  prediction: 'over' | 'under';
  projectedValue: number;
  confidence: number;
  expectedValue: number;
  factors: any;
}

/**
 * Predict a player prop
 */
export async function predictPlayerProp(
  input: PropPredictionInput
): Promise<PropPredictionOutput> {
  const factors: any = {};

  // 1. Historical average (season/recent games)
  const historicalAvg = await calculateHistoricalAverage(
    input.playerId,
    input.propType
  );
  factors.seasonAverage = historicalAvg.seasonAvg;
  factors.last5Average = historicalAvg.last5Avg;
  factors.last3Average = historicalAvg.last3Avg;

  // 2. Matchup analysis (vs opponent defense)
  const matchupData = await analyzeOpponentDefense(
    input.opponent,
    input.propType,
    input.position
  );
  factors.opponentRank = matchupData.rank;
  factors.opponentAvgAllowed = matchupData.avgAllowed;

  // 3. Home/Away splits
  const gameData = await prisma.game.findUnique({
    where: { id: input.gameId },
    select: { homeTeam: true },
  });
  const isHome = gameData?.homeTeam === input.team;
  factors.isHome = isHome;

  // 4. Weather impact (for outdoor games)
  const weather = await prisma.weatherReport.findFirst({
    where: { gameId: input.gameId },
    orderBy: { reportedAt: 'desc' },
  });
  factors.weatherImpact = weather ? weather.impactScore : 0;

  // 5. Injury status (player health)
  const injury = await prisma.injuryReport.findFirst({
    where: {
      playerId: input.playerId,
      reportedAt: {
        gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
      },
    },
    orderBy: { reportedAt: 'desc' },
  });
  factors.healthStatus = injury ? injury.status : 'healthy';
  factors.injuryImpact = injury ? injury.impactScore : 0;

  // Calculate projected value
  let projectedValue = historicalAvg.seasonAvg;

  // Adjust for recent form (weight recent games more)
  projectedValue = (projectedValue * 0.4) + (historicalAvg.last5Avg * 0.6);

  // Adjust for matchup (good matchup = boost, bad matchup = reduce)
  if (matchupData.rank <= 5) {
    // Top 5 worst defense (good matchup for player)
    projectedValue *= 1.15;
  } else if (matchupData.rank <= 10) {
    projectedValue *= 1.08;
  } else if (matchupData.rank >= 27) {
    // Top 5 best defense (bad matchup)
    projectedValue *= 0.85;
  } else if (matchupData.rank >= 22) {
    projectedValue *= 0.92;
  }

  // Adjust for home/away
  if (input.position === 'QB') {
    projectedValue *= isHome ? 1.05 : 0.95;
  }

  // Adjust for weather (passing props mainly)
  if (input.propType.includes('passing') && factors.weatherImpact > 50) {
    projectedValue *= 0.90;
  }

  // Adjust for injury
  if (factors.injuryImpact > 30) {
    projectedValue *= 0.85;
  }

  // Determine prediction
  const prediction = projectedValue > input.line ? 'over' : 'under';

  // Calculate confidence
  const difference = Math.abs(projectedValue - input.line);
  const percentDiff = (difference / input.line) * 100;

  let confidence = 50; // Base confidence
  if (percentDiff > 20) confidence += 30;
  else if (percentDiff > 15) confidence += 25;
  else if (percentDiff > 10) confidence += 20;
  else if (percentDiff > 7) confidence += 15;
  else if (percentDiff > 5) confidence += 10;
  else if (percentDiff > 3) confidence += 5;

  // Boost confidence for favorable matchups
  if (matchupData.rank <= 10) confidence += 5;
  else if (matchupData.rank >= 22) confidence -= 5;

  // Reduce confidence for injuries
  if (factors.injuryImpact > 30) confidence -= 15;
  else if (factors.injuryImpact > 15) confidence -= 8;

  confidence = Math.max(50, Math.min(95, confidence));

  // Calculate expected value
  const odds = prediction === 'over' ? (input.overOdds || -110) : (input.underOdds || -110);
  const impliedProb = odds > 0
    ? 100 / (odds + 100)
    : Math.abs(odds) / (Math.abs(odds) + 100);
  const trueProb = confidence / 100;
  const ev = (trueProb - impliedProb) * 100; // EV as percentage

  return {
    prediction,
    projectedValue: Math.round(projectedValue * 10) / 10,
    confidence: Math.round(confidence),
    expectedValue: Math.round(ev * 100) / 100,
    factors,
  };
}

/**
 * Calculate historical averages for a player
 */
async function calculateHistoricalAverage(
  playerId: string,
  propType: string
): Promise<{ seasonAvg: number; last5Avg: number; last3Avg: number }> {
  // This would fetch from a player stats database
  // For now, return dummy data - you'd integrate with a stats API

  // Simulated averages
  const baseValue = propType.includes('passing') ? 250 :
                    propType.includes('rushing') ? 80 :
                    propType.includes('receiving') ? 65 :
                    propType.includes('touchdown') ? 1.5 : 50;

  return {
    seasonAvg: baseValue,
    last5Avg: baseValue * (0.9 + Math.random() * 0.2), // 90-110% of season avg
    last3Avg: baseValue * (0.85 + Math.random() * 0.3), // 85-115% of season avg
  };
}

/**
 * Analyze opponent defense
 */
async function analyzeOpponentDefense(
  opponent: string,
  propType: string,
  position: string
): Promise<{ rank: number; avgAllowed: number }> {
  // This would fetch from a defensive stats database
  // For now, return simulated data

  // Random rank between 1-32
  const rank = Math.floor(Math.random() * 32) + 1;

  const baseAllowed = propType.includes('passing') ? 240 :
                      propType.includes('rushing') ? 100 :
                      propType.includes('receiving') ? 60 : 50;

  // Better defense (lower rank) = less allowed
  const avgAllowed = baseAllowed * (1 + ((rank - 16) / 32) * 0.3);

  return { rank, avgAllowed };
}

/**
 * Analyze player matchup (comprehensive analysis)
 */
export async function analyzePlayerMatchup(
  playerId: string,
  gameId: string
): Promise<any> {
  // Get game details
  const game = await prisma.game.findUnique({
    where: { id: gameId },
    select: {
      homeTeam: true,
      awayTeam: true,
      gameTime: true,
      sport: true,
    },
  });

  if (!game) {
    return null;
  }

  // Simulated matchup analysis
  return {
    defenseRank: Math.floor(Math.random() * 32) + 1,
    defenseRating: Math.round((Math.random() * 30 + 70) * 10) / 10,
    recentForm: [
      { game: 'vs Team A', stats: '25/35, 285 yds, 2 TD' },
      { game: 'vs Team B', stats: '22/30, 250 yds, 1 TD' },
      { game: 'vs Team C', stats: '28/40, 320 yds, 3 TD' },
    ],
    vsOpponentHistory: [
      { date: '2023-10-15', stats: '24/32, 270 yds, 2 TD' },
    ],
    projectedGameScript: 'Favorable - team expected to lead and pass frequently',
    keyNotes: [
      'Opponent allows 6th most passing yards per game',
      'Player has averaged 290+ yards in last 3 games',
      'Weather conditions favorable for passing',
    ],
  };
}

/**
 * Generate prop predictions for all upcoming games
 */
export async function generatePropPredictions(): Promise<number> {
  // Get upcoming games
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const games = await prisma.game.findMany({
    where: {
      gameTime: {
        gte: now,
        lte: tomorrow,
      },
      status: 'scheduled',
    },
  });

  // Get available player props from market
  const playerProps = await prisma.playerProp.findMany({
    where: {
      gameId: { in: games.map(g => g.id) },
    },
  });

  let generated = 0;

  for (const prop of playerProps) {
    try {
      // Generate prediction
      const prediction = await predictPlayerProp({
        playerId: prop.playerId,
        playerName: prop.playerName,
        team: prop.team,
        position: prop.position,
        gameId: prop.gameId,
        opponent: prop.opponent || 'Unknown',
        gameTime: prop.gameTime,
        propType: prop.propType,
        line: prop.line,
        overOdds: prop.overOdds,
        underOdds: prop.underOdds,
      });

      // Save prediction
      await prisma.propPrediction.upsert({
        where: {
          playerId_gameId_propType: {
            playerId: prop.playerId,
            gameId: prop.gameId,
            propType: prop.propType,
          },
        },
        update: {
          line: prop.line,
          prediction: prediction.prediction,
          projectedValue: prediction.projectedValue,
          confidence: prediction.confidence,
          overOdds: prop.overOdds,
          underOdds: prop.underOdds,
          expectedValue: prediction.expectedValue,
          factors: JSON.stringify(prediction.factors),
        },
        create: {
          playerId: prop.playerId,
          playerName: prop.playerName,
          team: prop.team,
          position: prop.position,
          gameId: prop.gameId,
          opponent: prop.opponent || 'Unknown',
          gameTime: prop.gameTime,
          propType: prop.propType,
          line: prop.line,
          prediction: prediction.prediction,
          projectedValue: prediction.projectedValue,
          confidence: prediction.confidence,
          overOdds: prop.overOdds,
          underOdds: prop.underOdds,
          expectedValue: prediction.expectedValue,
          factors: JSON.stringify(prediction.factors),
        },
      });

      generated++;
    } catch (error) {
      console.error('[PropsPredictor] Error generating prediction:', error);
    }
  }

  return generated;
}
