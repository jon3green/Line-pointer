#!/usr/bin/env tsx

/**
 * Backfill Historical Game Results
 *
 * Fetches historical game results from ESPN API and imports into database
 * This populates actualWinner, homeScore, awayScore for completed games
 *
 * Usage:
 *   npm run backfill:results -- --year 2024 --sport NFL
 *   npm run backfill:results -- --year 2024 --sport NCAAF
 *   npm run backfill:results -- --all  (backfills all sports, all recent seasons)
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ===== CONFIGURATION =====
const ESPN_API_BASE = 'https://site.api.espn.com/apis/site/v2/sports';
const BATCH_SIZE = 10;
const DELAY_MS = 1000; // Rate limiting

// ===== HELPER FUNCTIONS =====

async function fetchESPNGames(sport: 'NFL' | 'NCAAF', year: number, week?: number): Promise<any[]> {
  const sportPath = sport === 'NFL' ? 'football/nfl' : 'football/college-football';
  const weekParam = week ? `&week=${week}` : '';
  const url = `${ESPN_API_BASE}/${sportPath}/scoreboard?seasontype=2&year=${year}${weekParam}`;

  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`ESPN API error: ${response.statusText}`);

    const data = await response.json();
    return data.events || [];
  } catch (error) {
    console.error(`❌ Failed to fetch ${sport} games for ${year}:`, error);
    return [];
  }
}

function parseESPNGame(event: any, sport: string) {
  const game = event.competitions?.[0];
  if (!game) return null;

  const homeTeam = game.competitors.find((c: any) => c.homeAway === 'home');
  const awayTeam = game.competitors.find((c: any) => c.homeAway === 'away');

  if (!homeTeam || !awayTeam) return null;

  return {
    externalId: event.id,
    sport,
    homeTeam: homeTeam.team.displayName,
    awayTeam: awayTeam.team.displayName,
    homeScore: parseInt(homeTeam.score) || 0,
    awayScore: parseInt(awayTeam.score) || 0,
    status: game.status.type.completed ? 'final' : 'scheduled',
    gameTime: new Date(event.date),
    actualWinner: homeTeam.winner ? 'home' : awayTeam.winner ? 'away' : null,
    actualSpread: (parseInt(homeTeam.score) || 0) - (parseInt(awayTeam.score) || 0),
    actualTotal: (parseInt(homeTeam.score) || 0) + (parseInt(awayTeam.score) || 0),
  };
}

async function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ===== BACKFILL FUNCTIONS =====

async function backfillSeason(sport: 'NFL' | 'NCAAF', year: number) {
  console.log(`\n📥 Backfilling ${sport} ${year} season...`);

  const maxWeeks = sport === 'NFL' ? 18 : 15;
  let totalGames = 0;
  let totalUpdated = 0;

  for (let week = 1; week <= maxWeeks; week++) {
    console.log(`  Week ${week}/${maxWeeks}...`);

    const events = await fetchESPNGames(sport, year, week);

    for (const event of events) {
      const gameData = parseESPNGame(event, sport);
      if (!gameData || gameData.status !== 'final') continue;

      totalGames++;

      try {
        // Try to find existing game by external ID or team names + game time
        const existingGame = await prisma.game.findFirst({
          where: {
            OR: [
              { externalGameId: gameData.externalId },
              {
                homeTeam: gameData.homeTeam,
                awayTeam: gameData.awayTeam,
                gameTime: {
                  gte: new Date(gameData.gameTime.getTime() - 24 * 60 * 60 * 1000), // 1 day before
                  lte: new Date(gameData.gameTime.getTime() + 24 * 60 * 60 * 1000), // 1 day after
                },
              },
            ],
          },
        });

        if (existingGame) {
          // Update existing game with results
          await prisma.game.update({
            where: { id: existingGame.id },
            data: {
              externalGameId: gameData.externalId,
              homeScore: gameData.homeScore,
              awayScore: gameData.awayScore,
              status: gameData.status,
              actualWinner: gameData.actualWinner,
              actualSpread: gameData.actualSpread,
              actualTotal: gameData.actualTotal,
            },
          });
          totalUpdated++;
        } else {
          // Create new game
          await prisma.game.create({
            data: {
              externalGameId: gameData.externalId,
              sport: gameData.sport,
              homeTeam: gameData.homeTeam,
              awayTeam: gameData.awayTeam,
              gameTime: gameData.gameTime,
              homeScore: gameData.homeScore,
              awayScore: gameData.awayScore,
              status: gameData.status,
              actualWinner: gameData.actualWinner,
              actualSpread: gameData.actualSpread,
              actualTotal: gameData.actualTotal,
            },
          });
          totalUpdated++;
        }

        // Update any predictions for this game
        await updatePredictionsForGame(existingGame?.id, gameData);
      } catch (error) {
        console.error(`    ❌ Error processing game ${gameData.homeTeam} vs ${gameData.awayTeam}:`, error);
      }

      // Rate limiting
      await delay(DELAY_MS / BATCH_SIZE);
    }

    // Delay between weeks
    await delay(DELAY_MS);
  }

  console.log(`  ✅ Backfilled ${totalUpdated}/${totalGames} games\n`);
  return { totalGames, totalUpdated };
}

async function updatePredictionsForGame(gameId: string | undefined, gameData: any) {
  if (!gameId) return;

  // Find predictions for this game
  const predictions = await prisma.prediction.findMany({
    where: { gameId },
  });

  for (const prediction of predictions) {
    // Determine if prediction was correct
    const wasCorrect = prediction.predictedWinner === gameData.actualWinner;

    // Calculate spread correctness (if we made a spread prediction)
    let spreadCorrect = null;
    if (prediction.predictedSpread !== null) {
      const predictedHomeCover = prediction.predictedSpread > 0;
      const actualHomeCover = gameData.actualSpread > 0;
      spreadCorrect = predictedHomeCover === actualHomeCover;
    }

    // Update prediction with results
    await prisma.prediction.update({
      where: { id: prediction.id },
      data: {
        actualWinner: gameData.actualWinner,
        homeScore: gameData.homeScore,
        awayScore: gameData.awayScore,
        actualSpread: gameData.actualSpread,
        actualTotal: gameData.actualTotal,
        wasCorrect,
        spreadCorrect,
        resultsFetchedAt: new Date(),
      },
    });
  }
}

// ===== CLI INTERFACE =====

async function main() {
  const args = process.argv.slice(2);
  const yearArg = args.find(a => a.startsWith('--year='));
  const sportArg = args.find(a => a.startsWith('--sport='));
  const allFlag = args.includes('--all');

  console.log('🏈 Historical Results Backfill Script\n');
  console.log('=====================================\n');

  let results: any[] = [];

  if (allFlag) {
    // Backfill last 3 seasons for both sports
    console.log('🔄 Backfilling all sports and recent seasons...\n');
    const currentYear = new Date().getFullYear();

    for (const sport of ['NFL', 'NCAAF'] as const) {
      for (let year = currentYear - 2; year <= currentYear; year++) {
        const result = await backfillSeason(sport, year);
        results.push({ sport, year, ...result });
      }
    }
  } else {
    // Backfill specific sport and year
    const year = yearArg ? parseInt(yearArg.split('=')[1]) : new Date().getFullYear();
    const sport = sportArg ? sportArg.split('=')[1] as 'NFL' | 'NCAAF' : 'NFL';

    const result = await backfillSeason(sport, year);
    results.push({ sport, year, ...result });
  }

  // Print summary
  console.log('\n📊 BACKFILL COMPLETE\n');
  console.log('=====================\n');

  const totalGames = results.reduce((sum, r) => sum + r.totalGames, 0);
  const totalUpdated = results.reduce((sum, r) => sum + r.totalUpdated, 0);

  console.log(`Total games processed: ${totalGames}`);
  console.log(`Total games updated: ${totalUpdated}`);
  console.log(`Success rate: ${((totalUpdated / totalGames) * 100).toFixed(1)}%\n`);

  results.forEach(r => {
    console.log(`  ${r.sport} ${r.year}: ${r.totalUpdated}/${r.totalGames} games`);
  });

  console.log('\n✅ Backfill complete!\n');

  await prisma.$disconnect();
}

// Run the script
main().catch(error => {
  console.error('❌ Backfill failed:', error);
  process.exit(1);
});
