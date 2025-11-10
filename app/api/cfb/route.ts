export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import CFBData from '@/lib/api/college-football-data';

/**
 * GET /api/cfb
 * 
 * College Football Data API proxy
 * 
 * Query parameters:
 * - endpoint: 'teams' | 'games' | 'stats' | 'betting-lines' (required)
 * - year: season year (default: current year)
 * - week: week number (for games/betting-lines)
 * - team: team name (optional filter)
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const endpoint = searchParams.get('endpoint');
    const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString());
    const week = searchParams.get('week') ? parseInt(searchParams.get('week')!) : undefined;
    const team = searchParams.get('team') || undefined;

    if (!endpoint) {
      return NextResponse.json(
        { success: false, error: 'endpoint parameter is required' },
        { status: 400 }
      );
    }

    let data;

    switch (endpoint) {
      case 'teams':
        data = await CFBData.getCFBTeams();
        break;

      case 'games':
        if (!week) {
          return NextResponse.json(
            { success: false, error: 'week parameter is required for games endpoint' },
            { status: 400 }
          );
        }
        data = await CFBData.getCFBGames(year, week);
        break;

      case 'stats':
        data = await CFBData.getCFBTeamStats(year, team);
        break;

      case 'advanced-stats':
        data = await CFBData.getCFBAdvancedStats(year, team);
        break;

      case 'betting-lines':
        if (!week) {
          return NextResponse.json(
            { success: false, error: 'week parameter is required for betting-lines endpoint' },
            { status: 400 }
          );
        }
        data = await CFBData.getCFBBettingLines(year, week, team);
        break;

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid endpoint. Use: teams, games, stats, advanced-stats, or betting-lines' },
          { status: 400 }
        );
    }

    return NextResponse.json({ success: true, data });

  } catch (error) {
    console.error('CFB API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch College Football data',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

