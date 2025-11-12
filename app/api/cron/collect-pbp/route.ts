import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';

const execAsync = promisify(exec);

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes

/**
 * Execute Python script to collect play-by-play data
 */
async function runPBPCollection(years: number[]): Promise<{ success: boolean; output: string; error?: string }> {
  try {
    const scriptPath = path.join(process.cwd(), 'scripts', 'nflfastR', 'collect-pbp.py');
    const yearsArg = years.join(' ');
    const command = `python3 ${scriptPath} --years ${yearsArg}`;

    console.log('[PBP] Running command:', command);

    const { stdout, stderr } = await execAsync(command, {
      timeout: 240000, // 4 minutes
      env: {
        ...process.env,
        POSTGRES_PRISMA_URL: process.env.POSTGRES_PRISMA_URL,
      },
    });

    if (stderr && !stderr.includes('warning')) {
      console.error('[PBP] stderr:', stderr);
    }

    console.log('[PBP] stdout:', stdout);

    return {
      success: true,
      output: stdout,
    };
  } catch (error: any) {
    console.error('[PBP] Error running collection:', error);
    return {
      success: false,
      output: error.stdout || '',
      error: error.message || 'Failed to run PBP collection',
    };
  }
}

/**
 * GET /api/cron/collect-pbp
 * Cron endpoint for collecting play-by-play data weekly
 */
export async function GET(request: Request) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('[Cron] Starting play-by-play collection:', new Date().toISOString());

    // Collect data for current season and previous season
    const currentYear = new Date().getFullYear();
    const years = [currentYear - 1, currentYear];

    const result = await runPBPCollection(years);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error,
          output: result.output,
          timestamp: new Date().toISOString(),
        },
        { status: 500 }
      );
    }

    console.log('[Cron] Play-by-play collection completed');

    return NextResponse.json({
      success: true,
      message: 'Play-by-play data collected',
      years,
      output: result.output,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[Cron] Error collecting play-by-play data:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to collect play-by-play data',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  return GET(request);
}
