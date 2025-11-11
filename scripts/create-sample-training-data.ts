/**
 * Create Sample Training Data for ML Pipeline Testing
 *
 * Generates realistic sample predictions to test the ML training pipeline
 * before sufficient real data is collected.
 */

import { prisma } from '../lib/prisma';

async function createSampleTrainingData() {
  console.log('[Sample] Creating sample training data...');

  const teams = {
    NFL: [
      'Kansas City Chiefs', 'Buffalo Bills', 'San Francisco 49ers',
      'Philadelphia Eagles', 'Dallas Cowboys', 'Miami Dolphins',
      'Baltimore Ravens', 'Detroit Lions', 'Green Bay Packers',
      'Cincinnati Bengals', 'Jacksonville Jaguars', 'Cleveland Browns'
    ],
    NCAAF: [
      'Georgia Bulldogs', 'Alabama Crimson Tide', 'Ohio State Buckeyes',
      'Michigan Wolverines', 'Texas Longhorns', 'Oklahoma Sooners',
      'USC Trojans', 'Penn State Nittany Lions', 'Florida Gators',
      'LSU Tigers', 'Clemson Tigers', 'Notre Dame Fighting Irish'
    ]
  };

  const samplePredictions = [];
  const startDate = new Date('2024-09-01');

  // Generate 150 sample games (50 more than minimum required)
  for (let i = 0; i < 150; i++) {
    const sport = i < 75 ? 'NFL' : 'NCAAF';
    const sportTeams = teams[sport];

    // Random teams
    const homeIdx = Math.floor(Math.random() * sportTeams.length);
    let awayIdx = Math.floor(Math.random() * sportTeams.length);
    while (awayIdx === homeIdx) {
      awayIdx = Math.floor(Math.random() * sportTeams.length);
    }

    const homeTeam = sportTeams[homeIdx];
    const awayTeam = sportTeams[awayIdx];

    // Realistic odds
    const openingSpread = (Math.random() * 14 - 7); // -7 to +7
    const closingSpread = openingSpread + (Math.random() * 2 - 1); // Movement of -1 to +1

    const openingTotal = 45 + Math.random() * 15; // 45-60
    const closingTotal = openingTotal + (Math.random() * 4 - 2); // Movement of -2 to +2

    const openingML = openingSpread < 0 ? -150 - Math.random() * 100 : 100 + Math.random() * 150;
    const closingML = openingML + (Math.random() * 40 - 20);

    // Random confidence (weighted toward middle)
    const confidence = 45 + Math.random() * 40; // 45-85%

    // Predict home team win if spread is negative (favorite)
    const predictedWinner = openingSpread < 0 ? homeTeam : awayTeam;

    // Simulate game outcome (slightly favor favorites)
    const homeWins = Math.random() < (openingSpread < 0 ? 0.58 : 0.42);
    const actualWinner = homeWins ? homeTeam : awayTeam;

    // Generate realistic scores
    const expectedTotal = openingTotal;
    const homeScore = homeWins
      ? Math.round(expectedTotal * 0.55 + (Math.random() * 10 - 5))
      : Math.round(expectedTotal * 0.45 + (Math.random() * 10 - 5));
    const awayScore = Math.round(expectedTotal - homeScore + (Math.random() * 6 - 3));

    const actualSpread = homeScore - awayScore;
    const actualTotal = homeScore + awayScore;

    // Calculate if prediction was correct
    const wasCorrect = predictedWinner === actualWinner;

    // Spread correctness (did home team beat the spread?)
    const spreadCorrect = actualSpread > closingSpread;

    // Total correctness (over/under)
    const totalCorrect = actualTotal > closingTotal;

    // CLV calculations
    const spreadCLV = Math.abs(openingSpread) - Math.abs(closingSpread);
    const beatTheCloseSpread = openingSpread < closingSpread;

    const totalCLV = closingTotal - openingTotal;
    const beatTheCloseTotal = openingTotal < closingTotal;

    const mlCLV = (openingML > 0 ? openingML : -100/openingML) -
                  (closingML > 0 ? closingML : -100/closingML);
    const beatTheCloseML = openingML > closingML;

    // Game time (spread over 15 weeks)
    const weekOffset = Math.floor(i / 10);
    const gameTime = new Date(startDate);
    gameTime.setDate(gameTime.getDate() + weekOffset * 7 + Math.floor(Math.random() * 4));
    gameTime.setHours(13 + Math.floor(Math.random() * 8));

    samplePredictions.push({
      gameId: `sample_${sport}_${i}`,
      externalGameId: `ext_${i}`,
      sport,
      gameTime,
      homeTeam,
      awayTeam,
      predictedWinner,
      confidence: Math.round(confidence * 100) / 100,
      predictedSpread: openingSpread,
      predictedTotal: openingTotal,

      // Odds
      openingSpread: Math.round(openingSpread * 100) / 100,
      closingSpread: Math.round(closingSpread * 100) / 100,
      openingTotal: Math.round(openingTotal * 100) / 100,
      closingTotal: Math.round(closingTotal * 100) / 100,
      openingML: Math.round(openingML),
      closingML: Math.round(closingML),

      // Results
      actualWinner,
      homeScore,
      awayScore,
      actualSpread: Math.round(actualSpread * 100) / 100,
      actualTotal,

      // Outcomes
      wasCorrect,
      spreadCorrect,
      totalCorrect,
      moneylineCorrect: wasCorrect,

      // CLV
      spreadCLV: Math.round(spreadCLV * 100) / 100,
      beatTheCloseSpread,
      totalCLV: Math.round(totalCLV * 100) / 100,
      beatTheCloseTotal,
      mlCLV: Math.round(mlCLV * 100) / 100,
      beatTheCloseML,
      closingLineCapturedAt: new Date(gameTime.getTime() - 2 * 60 * 60 * 1000), // 2 hours before

      // Metadata
      resultsFetchedAt: new Date(gameTime.getTime() + 3 * 60 * 60 * 1000), // 3 hours after game
      createdAt: new Date(gameTime.getTime() - 24 * 60 * 60 * 1000), // 1 day before game
      updatedAt: new Date(gameTime.getTime() + 3 * 60 * 60 * 1000), // 3 hours after game
    });
  }

  // Clear existing sample data first
  console.log('[Sample] Clearing existing sample data...');
  await prisma.prediction.deleteMany({
    where: {
      gameId: {
        startsWith: 'sample_'
      }
    }
  });

  // Insert one by one with progress
  console.log(`[Sample] Inserting ${samplePredictions.length} sample predictions...`);

  let inserted = 0;
  for (const pred of samplePredictions) {
    try {
      await prisma.prediction.create({ data: pred });
      inserted++;
      if (inserted % 25 === 0) {
        console.log(`[Sample] Inserted ${inserted}/${samplePredictions.length}...`);
      }
    } catch (error: any) {
      console.error(`[Sample] Error inserting game ${pred.gameId}:`, error.message);
    }
  }

  console.log(`[Sample] Successfully inserted ${inserted}/${samplePredictions.length} predictions`);

  // Calculate statistics
  const stats = {
    total: samplePredictions.length,
    correct: samplePredictions.filter(p => p.wasCorrect).length,
    accuracy: (samplePredictions.filter(p => p.wasCorrect).length / samplePredictions.length * 100).toFixed(2),
    spreadAccuracy: (samplePredictions.filter(p => p.spreadCorrect).length / samplePredictions.length * 100).toFixed(2),
    avgConfidence: (samplePredictions.reduce((sum, p) => sum + p.confidence, 0) / samplePredictions.length).toFixed(2),
    avgSpreadCLV: (samplePredictions.reduce((sum, p) => sum + (p.spreadCLV || 0), 0) / samplePredictions.length).toFixed(2),
    beatCloseRate: (samplePredictions.filter(p => p.beatTheCloseSpread).length / samplePredictions.length * 100).toFixed(2),
  };

  console.log('\n[Sample] Sample Data Statistics:');
  console.log(`  Total Games: ${stats.total}`);
  console.log(`  Overall Accuracy: ${stats.accuracy}%`);
  console.log(`  Spread Accuracy: ${stats.spreadAccuracy}%`);
  console.log(`  Avg Confidence: ${stats.avgConfidence}%`);
  console.log(`  Avg Spread CLV: ${stats.avgSpreadCLV} points`);
  console.log(`  Beat Close Rate: ${stats.beatCloseRate}%`);

  console.log('\n[Sample] Sample training data created successfully!');
  console.log('[Sample] You can now test the ML pipeline:');
  console.log('  1. npx tsx scripts/export-training-data.ts');
  console.log('  2. source ml-service/venv/bin/activate');
  console.log('  3. python ml-service/train_model.py');
}

// Run if called directly
if (require.main === module) {
  createSampleTrainingData()
    .then(() => {
      console.log('[Sample] Complete');
      process.exit(0);
    })
    .catch(error => {
      console.error('[Sample] Error:', error);
      process.exit(1);
    });
}

export { createSampleTrainingData };
