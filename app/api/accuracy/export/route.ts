import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { exportTrainingData } from '@/lib/services/prediction-tracker';

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes for large exports

/**
 * GET /api/accuracy/export
 *
 * Export prediction data for ML training
 * Returns predictions with all factors in ML-friendly format
 *
 * Output format:
 * - Features (X): All 50+ decision factors
 * - Labels (y): actualWinner, wasCorrect, actualSpread
 * - Metadata: gameId, sport, predictionDate, confidence
 *
 * This endpoint is used by the Python ML training pipeline
 */
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Admin/Pro users only
    // @ts-ignore
    if (session.user?.subscription?.tier !== 'premium' && session.user?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Premium subscription required for data export' },
        { status: 403 }
      );
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const sport = searchParams.get('sport') || undefined;
    const startDate = searchParams.get('startDate')
      ? new Date(searchParams.get('startDate')!)
      : undefined;
    const endDate = searchParams.get('endDate')
      ? new Date(searchParams.get('endDate')!)
      : undefined;
    const format = searchParams.get('format') || 'json'; // json or csv

    console.log('[Export] Exporting training data:', { sport, startDate, endDate, format });

    const trainingData = await exportTrainingData({
      sport,
      startDate,
      endDate,
    });

    if (!trainingData || trainingData.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No training data available',
        message: 'No predictions with results found for the specified filters',
      });
    }

    console.log(`[Export] Exported ${trainingData.length} predictions`);

    // JSON format
    if (format === 'json') {
      return NextResponse.json({
        success: true,
        data: trainingData,
        count: trainingData.length,
        filters: { sport, startDate, endDate },
        exportedAt: new Date().toISOString(),
      });
    }

    // CSV format
    if (format === 'csv') {
      // Convert to CSV
      const headers = Object.keys(trainingData[0]);
      const csvRows = [
        headers.join(','),
        ...trainingData.map(row =>
          headers
            .map(header => {
              const value = (row as any)[header];
              // Handle objects/arrays
              if (typeof value === 'object' && value !== null) {
                return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
              }
              // Handle strings with commas
              if (typeof value === 'string' && value.includes(',')) {
                return `"${value.replace(/"/g, '""')}"`;
              }
              return value;
            })
            .join(',')
        ),
      ];

      const csv = csvRows.join('\n');

      return new NextResponse(csv, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="predictions_${sport || 'all'}_${new Date().toISOString()}.csv"`,
        },
      });
    }

    return NextResponse.json(
      { success: false, error: 'Invalid format. Use json or csv' },
      { status: 400 }
    );
  } catch (error) {
    console.error('[Export] Error exporting training data:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to export training data',
      },
      { status: 500 }
    );
  }
}
