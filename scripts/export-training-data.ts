/**
 * Export Training Data for Python ML Models
 *
 * Exports historical game data, predictions, and outcomes
 * to CSV format for Python ML training
 */

import { prisma } from '../lib/prisma';
import fs from 'fs';
import path from 'path';

interface TrainingDataRow {
  // Game identifiers
  gameId: string;
  sport: string;
  gameTime: string;

  // Teams
  homeTeam: string;
  awayTeam: string;

  // Odds data
  openingSpread: number | null;
  closingSpread: number | null;
  openingTotal: number | null;
  closingTotal: number | null;
  openingML: number | null;
  closingML: number | null;

  // Prediction
  predictedWinner: string;
  confidence: number;
  predictedSpread: number | null;
  predictedTotal: number | null;

  // Actual results
  actualWinner: string | null;
  homeScore: number | null;
  awayScore: number | null;
  actualSpread: number | null;
  actualTotal: number | null;

  // Outcomes
  wasCorrect: boolean | null;
  spreadCorrect: boolean | null;
  totalCorrect: boolean | null;
  moneylineCorrect: boolean | null;

  // CLV metrics
  spreadCLV: number | null;
  totalCLV: number | null;
  mlCLV: number | null;
  beatTheCloseSpread: boolean | null;
  beatTheCloseTotal: boolean | null;
}

async function exportTrainingData() {
  console.log('[Export] Starting training data export...');

  try {
    // Get all completed predictions with results
    const predictions = await prisma.prediction.findMany({
      where: {
        wasCorrect: { not: null }, // Only completed games
      },
      orderBy: {
        gameTime: 'asc',
      },
    });

    console.log(`[Export] Found ${predictions.length} completed predictions`);

    if (predictions.length === 0) {
      console.log('[Export] No training data available yet');
      return;
    }

    // Convert to training data format
    const trainingData: TrainingDataRow[] = predictions.map(p => ({
      gameId: p.gameId,
      sport: p.sport,
      gameTime: p.gameTime.toISOString(),
      homeTeam: p.homeTeam,
      awayTeam: p.awayTeam,
      openingSpread: p.openingSpread,
      closingSpread: p.closingSpread,
      openingTotal: p.openingTotal,
      closingTotal: p.closingTotal,
      openingML: p.openingML,
      closingML: p.closingML,
      predictedWinner: p.predictedWinner,
      confidence: p.confidence,
      predictedSpread: p.predictedSpread,
      predictedTotal: p.predictedTotal,
      actualWinner: p.actualWinner,
      homeScore: p.homeScore,
      awayScore: p.awayScore,
      actualSpread: p.actualSpread,
      actualTotal: p.actualTotal,
      wasCorrect: p.wasCorrect,
      spreadCorrect: p.spreadCorrect,
      totalCorrect: p.totalCorrect,
      moneylineCorrect: p.moneylineCorrect,
      spreadCLV: p.spreadCLV,
      totalCLV: p.totalCLV,
      mlCLV: p.mlCLV,
      beatTheCloseSpread: p.beatTheCloseSpread,
      beatTheCloseTotal: p.beatTheCloseTotal,
    }));

    // Convert to CSV
    const headers = Object.keys(trainingData[0]).join(',');
    const rows = trainingData.map(row =>
      Object.values(row).map(val =>
        val === null ? '' : typeof val === 'string' ? `"${val}"` : val
      ).join(',')
    );

    const csv = [headers, ...rows].join('\n');

    // Create output directory
    const outputDir = path.join(process.cwd(), 'ml-service', 'data');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Write CSV file
    const outputPath = path.join(outputDir, 'training_data.csv');
    fs.writeFileSync(outputPath, csv);

    console.log(`[Export] Successfully exported ${trainingData.length} rows to ${outputPath}`);

    // Export statistics
    const stats = {
      totalGames: trainingData.length,
      sports: {
        NFL: trainingData.filter(d => d.sport === 'NFL').length,
        NCAAF: trainingData.filter(d => d.sport === 'NCAAF').length,
      },
      accuracy: {
        overall: trainingData.filter(d => d.wasCorrect).length / trainingData.length,
        spread: trainingData.filter(d => d.spreadCorrect).length /
                trainingData.filter(d => d.spreadCorrect !== null).length,
        total: trainingData.filter(d => d.totalCorrect).length /
               trainingData.filter(d => d.totalCorrect !== null).length,
      },
      clv: {
        avgSpreadCLV: trainingData
          .filter(d => d.spreadCLV !== null)
          .reduce((sum, d) => sum + (d.spreadCLV || 0), 0) /
          trainingData.filter(d => d.spreadCLV !== null).length,
        beatCloseRate: trainingData.filter(d => d.beatTheCloseSpread).length /
                       trainingData.filter(d => d.beatTheCloseSpread !== null).length,
      },
    };

    const statsPath = path.join(outputDir, 'training_stats.json');
    fs.writeFileSync(statsPath, JSON.stringify(stats, null, 2));

    console.log('[Export] Training statistics:', stats);
    console.log(`[Export] Statistics saved to ${statsPath}`);

    return {
      success: true,
      outputPath,
      recordCount: trainingData.length,
      stats,
    };

  } catch (error) {
    console.error('[Export] Error exporting training data:', error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  exportTrainingData()
    .then(() => {
      console.log('[Export] Export complete');
      process.exit(0);
    })
    .catch(error => {
      console.error('[Export] Export failed:', error);
      process.exit(1);
    });
}

export { exportTrainingData };
