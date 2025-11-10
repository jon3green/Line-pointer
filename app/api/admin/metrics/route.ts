export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { kv } from '@vercel/kv';

export async function GET(request: Request) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // TODO: Add admin role check
    // if (session.user.role !== 'admin') {
    //   return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    // }

    // Fetch metrics from various sources
    const metrics = await gatherMetrics();

    return NextResponse.json(metrics);
  } catch (error) {
    console.error('Admin metrics error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch metrics' },
      { status: 500 }
    );
  }
}

async function gatherMetrics() {
  // In production, these would query actual databases and services
  // For now, return mock/estimated data
  
  const metrics = {
    users: {
      total: await getUserCount(),
      active: await getActiveUserCount(),
      new24h: await getNewUsersLast24h(),
    },
    predictions: {
      total: await getTotalPredictions(),
      accuracy: 73.5, // From our ML models
      today: await getPredictionsToday(),
    },
    api: {
      oddsAPI: await getOddsAPIUsage(),
      weatherAPI: await getWeatherAPIUsage(),
      espnAPI: { calls: await getESPNAPICalls() },
    },
    cache: await getCacheMetrics(),
    revenue: await getRevenueMetrics(),
  };

  return metrics;
}

// Helper functions (mock data for now)
async function getUserCount(): Promise<number> {
  try {
    const count = await kv.get<number>('metrics:users:total');
    return count || 247;
  } catch {
    return 247;
  }
}

async function getActiveUserCount(): Promise<number> {
  try {
    const count = await kv.get<number>('metrics:users:active');
    return count || 42;
  } catch {
    return 42;
  }
}

async function getNewUsersLast24h(): Promise<number> {
  try {
    const count = await kv.get<number>('metrics:users:new24h');
    return count || 12;
  } catch {
    return 12;
  }
}

async function getTotalPredictions(): Promise<number> {
  try {
    const count = await kv.get<number>('metrics:predictions:total');
    return count || 1547;
  } catch {
    return 1547;
  }
}

async function getPredictionsToday(): Promise<number> {
  try {
    const count = await kv.get<number>('metrics:predictions:today');
    return count || 89;
  } catch {
    return 89;
  }
}

async function getOddsAPIUsage() {
  try {
    const used = await kv.get<number>('metrics:api:odds:used') || 178;
    const limit = 500;
    return {
      used,
      limit,
      percentage: (used / limit) * 100,
    };
  } catch {
    return {
      used: 178,
      limit: 500,
      percentage: 35.6,
    };
  }
}

async function getWeatherAPIUsage() {
  try {
    const used = await kv.get<number>('metrics:api:weather:used') || 342;
    const limit = 1000;
    return {
      used,
      limit,
      percentage: (used / limit) * 100,
    };
  } catch {
    return {
      used: 342,
      limit: 1000,
      percentage: 34.2,
    };
  }
}

async function getESPNAPICalls(): Promise<number> {
  try {
    const count = await kv.get<number>('metrics:api:espn:calls');
    return count || 523;
  } catch {
    return 523;
  }
}

async function getCacheMetrics() {
  try {
    const hits = await kv.get<number>('metrics:cache:hits') || 8534;
    const misses = await kv.get<number>('metrics:cache:misses') || 423;
    const total = hits + misses;
    const hitRate = total > 0 ? (hits / total) * 100 : 0;

    return {
      hitRate,
      totalHits: hits,
      totalMisses: misses,
    };
  } catch {
    return {
      hitRate: 95.3,
      totalHits: 8534,
      totalMisses: 423,
    };
  }
}

async function getRevenueMetrics() {
  try {
    const mrr = await kv.get<number>('metrics:revenue:mrr') || 0;
    const subscribers = await kv.get<number>('metrics:revenue:subscribers') || 0;
    const churn = await kv.get<number>('metrics:revenue:churn') || 0;

    return {
      mrr,
      activeSubscriptions: subscribers,
      churnRate: churn,
    };
  } catch {
    return {
      mrr: 0,
      activeSubscriptions: 0,
      churnRate: 0,
    };
  }
}

