import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes for training

/**
 * Weekly Model Retraining Cron Job
 *
 * Schedule: Every Monday at 6am (after weekend games)
 * Vercel Cron: 0 6 * * 1
 *
 * Tasks:
 * 1. Fetch latest game results
 * 2. Update prediction accuracy
 * 3. Retrain ML models on new data
 * 4. Validate model performance
 * 5. Deploy new model if accuracy improves > 2%
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  const expectedAuth = `Bearer ${process.env.CRON_SECRET || 'dev-secret'}`;

  if (authHeader !== expectedAuth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    console.log('[Cron] Starting weekly model retraining...');
    const startTime = Date.now();

    // Step 1: Backfill recent results
    console.log('[Cron] Step 1/5: Backfilling recent results...');
    await execAsync('npm run backfill:results -- --all');

    // Step 2: Calculate accuracy metrics
    console.log('[Cron] Step 2/5: Calculating accuracy metrics...');
    const accuracyResponse = await fetch(`${process.env.NEXTAUTH_URL}/api/ml/accuracy-check`, {
      method: 'POST',
    });
    const accuracyData = await accuracyResponse.json();

    console.log('[Cron] Current model accuracy:', accuracyData.accuracy);

    // Step 3: Retrain models
    console.log('[Cron] Step 3/5: Retraining ML models...');

    const sports = ['NFL', 'NCAAF'];
    const results = [];

    for (const sport of sports) {
      try {
        const { stdout, stderr } = await execAsync(
          `python3 scripts/ml/train_model.py --sport ${sport} --min-games 100 --retrain`
        );

        console.log(`[Cron] ${sport} training output:`, stdout);

        // Parse training results
        const accuracyMatch = stdout.match(/Best accuracy: ([\d.]+)/);
        const newAccuracy = accuracyMatch ? parseFloat(accuracyMatch[1]) : 0;

        results.push({
          sport,
          oldAccuracy: accuracyData[sport.toLowerCase()]?.accuracy || 0,
          newAccuracy,
          improved: newAccuracy > (accuracyData[sport.toLowerCase()]?.accuracy || 0),
          improvementPct:
            ((newAccuracy - (accuracyData[sport.toLowerCase()]?.accuracy || 0)) / (accuracyData[sport.toLowerCase()]?.accuracy || 1)) * 100,
        });
      } catch (error) {
        console.error(`[Cron] Error training ${sport} model:`, error);
        results.push({
          sport,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    // Step 4: Validate and deploy if improved
    console.log('[Cron] Step 4/5: Validating models...');

    const deployments = results.filter(r => !r.error && r.improved && r.improvementPct > 2);

    if (deployments.length > 0) {
      console.log('[Cron] Step 5/5: Deploying improved models...');

      for (const deployment of deployments) {
        console.log(
          `[Cron] Deploying ${deployment.sport} model (${deployment.improvementPct.toFixed(2)}% improvement)`
        );

        // TODO: Update model version in database
        // TODO: Notify admins of deployment
      }
    } else {
      console.log('[Cron] Step 5/5: No deployments needed (no significant improvements)');
    }

    const duration = Date.now() - startTime;

    // Log results
    const summary = {
      success: true,
      duration: `${duration}ms`,
      sports: results.length,
      improved: results.filter(r => r.improved).length,
      deployed: deployments.length,
      results,
      timestamp: new Date().toISOString(),
    };

    console.log('[Cron] Weekly retraining complete:', summary);

    return NextResponse.json(summary);
  } catch (error) {
    console.error('[Cron] Retraining error:', error);
    return NextResponse.json(
      {
        error: 'Failed to retrain models',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
