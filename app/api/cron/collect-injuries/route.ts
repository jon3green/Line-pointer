import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import * as cheerio from 'cheerio';

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes

interface InjuryReport {
  playerName: string;
  team: string;
  position: string;
  injuryStatus: 'Out' | 'Doubtful' | 'Questionable' | 'Probable' | 'IR';
  injuryType: string;
  lastUpdate: Date;
  source: string;
}

/**
 * Fetch injuries from ESPN API
 */
async function fetchESPNInjuries(sport: 'nfl' | 'college-football'): Promise<InjuryReport[]> {
  const injuries: InjuryReport[] = [];

  try {
    // ESPN provides injury data in their team APIs
    const response = await fetch(
      `https://site.api.espn.com/apis/site/v2/sports/football/${sport}/teams`,
      { headers: { 'Accept': 'application/json' } }
    );

    if (!response.ok) {
      throw new Error(`ESPN Teams API error: ${response.status}`);
    }

    const data = await response.json();
    const teams = data.sports[0]?.leagues[0]?.teams || [];

    // Fetch injury report for each team
    for (const teamData of teams) {
      const team = teamData.team;
      try {
        const injuryResponse = await fetch(
          `https://site.api.espn.com/apis/site/v2/sports/football/${sport}/teams/${team.id}/injuries`,
          { headers: { 'Accept': 'application/json' } }
        );

        if (injuryResponse.ok) {
          const injuryData = await injuryResponse.json();
          const teamInjuries = injuryData.injuries || [];

          for (const injury of teamInjuries) {
            injuries.push({
              playerName: injury.athlete?.displayName || 'Unknown',
              team: team.displayName,
              position: injury.athlete?.position?.abbreviation || 'N/A',
              injuryStatus: mapInjuryStatus(injury.status),
              injuryType: injury.details?.type || injury.details?.detail || 'Undisclosed',
              lastUpdate: new Date(injury.date || Date.now()),
              source: 'ESPN',
            });
          }
        }
      } catch (error) {
        console.error(`[Injuries] Error fetching injuries for ${team.displayName}:`, error);
      }

      // Rate limit: wait 100ms between requests
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  } catch (error) {
    console.error('[Injuries] Error fetching ESPN injuries:', error);
  }

  return injuries;
}

/**
 * Scrape injuries from FantasyPros (backup source)
 */
async function scrapeFantasyProsInjuries(sport: 'nfl' | 'ncaaf'): Promise<InjuryReport[]> {
  const injuries: InjuryReport[] = [];

  try {
    const url = sport === 'nfl'
      ? 'https://www.fantasypros.com/nfl/injury-report.php'
      : 'https://www.fantasypros.com/college-football/injury-report.php';

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    if (!response.ok) {
      console.log(`[Injuries] FantasyPros returned ${response.status}`);
      return injuries;
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    $('table.table tbody tr').each((_, row) => {
      const $row = $(row);
      const cells = $row.find('td');

      if (cells.length >= 5) {
        const playerName = $(cells[0]).text().trim();
        const team = $(cells[1]).text().trim();
        const position = $(cells[2]).text().trim();
        const injuryStatus = $(cells[3]).text().trim();
        const injuryType = $(cells[4]).text().trim();

        if (playerName && team) {
          injuries.push({
            playerName,
            team,
            position,
            injuryStatus: mapInjuryStatus(injuryStatus),
            injuryType: injuryType || 'Undisclosed',
            lastUpdate: new Date(),
            source: 'FantasyPros',
          });
        }
      }
    });
  } catch (error) {
    console.error('[Injuries] Error scraping FantasyPros:', error);
  }

  return injuries;
}

/**
 * Map various injury status formats to standard format
 */
function mapInjuryStatus(status: string): 'Out' | 'Doubtful' | 'Questionable' | 'Probable' | 'IR' {
  const normalized = status.toLowerCase();

  if (normalized.includes('out') || normalized.includes('o')) return 'Out';
  if (normalized.includes('doubtful') || normalized.includes('d')) return 'Doubtful';
  if (normalized.includes('questionable') || normalized.includes('q')) return 'Questionable';
  if (normalized.includes('probable') || normalized.includes('p')) return 'Probable';
  if (normalized.includes('ir') || normalized.includes('reserve')) return 'IR';

  return 'Questionable'; // Default
}

/**
 * Calculate injury impact score (0-100)
 */
function calculateInjuryImpact(injury: InjuryReport): number {
  let impact = 0;

  // Status impact
  switch (injury.injuryStatus) {
    case 'Out': impact += 50; break;
    case 'IR': impact += 50; break;
    case 'Doubtful': impact += 35; break;
    case 'Questionable': impact += 20; break;
    case 'Probable': impact += 10; break;
  }

  // Position impact (skill positions matter more)
  const keyPositions = ['QB', 'RB', 'WR', 'TE', 'DB', 'LB', 'DL'];
  if (keyPositions.includes(injury.position)) {
    impact += 30;
  } else {
    impact += 15;
  }

  // Injury type impact
  const severeInjuries = ['acl', 'concussion', 'fracture', 'torn', 'broken'];
  if (severeInjuries.some(severe => injury.injuryType.toLowerCase().includes(severe))) {
    impact += 20;
  }

  return Math.min(impact, 100);
}

/**
 * Store injuries in database
 */
async function storeInjuries(injuries: InjuryReport[]) {
  let stored = 0;
  let updated = 0;

  for (const injury of injuries) {
    try {
      // Find or create player
      const player = await prisma.player.upsert({
        where: {
          name_team: {
            name: injury.playerName,
            team: injury.team,
          },
        },
        update: {
          position: injury.position,
          isActive: injury.injuryStatus !== 'Out' && injury.injuryStatus !== 'IR',
        },
        create: {
          name: injury.playerName,
          team: injury.team,
          position: injury.position,
          sport: injury.source === 'ESPN' ? 'NFL' : 'NFL',
          isActive: injury.injuryStatus !== 'Out' && injury.injuryStatus !== 'IR',
        },
      });

      // Store injury in player stats (as JSON)
      const impactScore = calculateInjuryImpact(injury);

      await prisma.player.update({
        where: { id: player.id },
        data: {
          seasonStats: JSON.stringify({
            injury: {
              status: injury.injuryStatus,
              type: injury.injuryType,
              impact: impactScore,
              lastUpdate: injury.lastUpdate,
              source: injury.source,
            },
          }),
        },
      });

      if (player.createdAt.getTime() === player.lastUpdated.getTime()) {
        stored++;
      } else {
        updated++;
      }
    } catch (error) {
      console.error(`[Injuries] Error storing injury for ${injury.playerName}:`, error);
    }
  }

  return { stored, updated };
}

/**
 * GET /api/cron/collect-injuries
 * Cron endpoint for collecting injury reports daily
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

    console.log('[Cron] Starting injury collection:', new Date().toISOString());

    const results = {
      nfl: { fetched: 0, stored: 0, updated: 0 },
      cfb: { fetched: 0, stored: 0, updated: 0 },
    };

    // Collect NFL injuries
    console.log('[Injuries] Fetching NFL injuries from ESPN...');
    const nflInjuriesESPN = await fetchESPNInjuries('nfl');
    results.nfl.fetched += nflInjuriesESPN.length;

    console.log('[Injuries] Fetching NFL injuries from FantasyPros...');
    const nflInjuriesFP = await scrapeFantasyProsInjuries('nfl');
    results.nfl.fetched += nflInjuriesFP.length;

    // Combine and deduplicate
    const allNFLInjuries = [...nflInjuriesESPN, ...nflInjuriesFP];
    const uniqueNFLInjuries = Array.from(
      new Map(allNFLInjuries.map(inj => [
        `${inj.playerName}-${inj.team}`,
        inj
      ])).values()
    );

    const nflStats = await storeInjuries(uniqueNFLInjuries);
    results.nfl.stored = nflStats.stored;
    results.nfl.updated = nflStats.updated;

    // Collect College Football injuries
    console.log('[Injuries] Fetching CFB injuries from ESPN...');
    const cfbInjuriesESPN = await fetchESPNInjuries('college-football');
    results.cfb.fetched += cfbInjuriesESPN.length;

    const uniqueCFBInjuries = Array.from(
      new Map(cfbInjuriesESPN.map(inj => [
        `${inj.playerName}-${inj.team}`,
        inj
      ])).values()
    );

    const cfbStats = await storeInjuries(uniqueCFBInjuries);
    results.cfb.stored = cfbStats.stored;
    results.cfb.updated = cfbStats.updated;

    console.log('[Cron] Injury collection completed:', results);

    return NextResponse.json({
      success: true,
      message: 'Injury reports collected',
      results,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[Cron] Error collecting injuries:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to collect injuries',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  return GET(request);
}
