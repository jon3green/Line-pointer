#!/usr/bin/env tsx

import { mkdir, writeFile } from 'fs/promises';
import path from 'path';
import { setTimeout as sleep } from 'timers/promises';

interface ScheduleResponse {
  weeks?: Array<{
    id: string;
    sequence: number;
    title: string;
    games: Array<{
      id: string;
      scheduled: string;
      home: { alias: string };
      away: { alias: string };
    }>;
  }>;
}

const API_KEY = process.env.SPORTRADAR_API_KEY;
const ACCESS_LEVEL = process.env.SPORTRADAR_ACCESS_LEVEL ?? 'trial';
const LOCALE = process.env.SPORTRADAR_LOCALE ?? 'en';
const API_VERSION = process.env.SPORTRADAR_API_VERSION ?? 'v7';
const SPORT = 'nfl';
const PROVIDER = 'official';

if (!API_KEY) {
  console.error('Missing SPORTRADAR_API_KEY environment variable.');
  process.exit(1);
}

interface CliOptions {
  seasonYear: number;
  seasonType: 'PRE' | 'REG' | 'POST';
  outputDir: string;
  throttleMs: number;
}

function parseArgs(): CliOptions {
  const args = process.argv.slice(2);
  const options: Partial<CliOptions> = {};

  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    if (arg === '--season' || arg === '-s') {
      options.seasonYear = Number(args[++i]);
    } else if (arg === '--type' || arg === '-t') {
      const value = (args[++i] ?? '').toUpperCase();
      if (!['PRE', 'REG', 'POST'].includes(value)) {
        throw new Error('season type must be one of PRE, REG, POST');
      }
      options.seasonType = value as CliOptions['seasonType'];
    } else if (arg === '--out' || arg === '-o') {
      options.outputDir = args[++i];
    } else if (arg === '--throttle') {
      options.throttleMs = Number(args[++i]);
    }
  }

  if (!options.seasonYear) {
    throw new Error('Missing --season argument (e.g. --season 2023)');
  }

  return {
    seasonYear: options.seasonYear,
    seasonType: options.seasonType ?? 'REG',
    outputDir: options.outputDir ?? path.resolve('data/sportradar/raw'),
    throttleMs: options.throttleMs ?? 1200,
  };
}

function scheduleUrl(year: number, seasonType: string) {
  return `https://api.sportradar.us/${SPORT}/${PROVIDER}/${ACCESS_LEVEL}/${API_VERSION}/${LOCALE}/games/${year}/${seasonType}/schedule.json?api_key=${API_KEY}`;
}

function pbpUrl(gameId: string) {
  return `https://api.sportradar.us/${SPORT}/${PROVIDER}/${ACCESS_LEVEL}/${API_VERSION}/${LOCALE}/games/${gameId}/pbp.json?api_key=${API_KEY}`;
}

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Request failed (${response.status}) ${response.statusText}: ${body}`);
  }
  return response.json() as Promise<T>;
}

async function run() {
  const options = parseArgs();
  const outputRoot = path.resolve(options.outputDir, `${options.seasonYear}`, options.seasonType.toLowerCase());
  await mkdir(outputRoot, { recursive: true });

  console.log(`Fetching schedule ${options.seasonYear} ${options.seasonType}...`);
  const schedule = await fetchJson<ScheduleResponse>(scheduleUrl(options.seasonYear, options.seasonType));
  const games = schedule.weeks?.flatMap((week) => week.games.map((game) => ({ ...game, week: week.sequence }))) ?? [];
  console.log(`Found ${games.length} games in schedule.`);

  for (const [index, game] of games.entries()) {
    const outFile = path.join(outputRoot, `${game.id}.json`);
    try {
      console.log(`[${index + 1}/${games.length}] Fetching ${game.id} (${game.away.alias}@${game.home.alias})`);
      const pbp = await fetchJson<Record<string, unknown>>(pbpUrl(game.id));
      await writeFile(outFile, JSON.stringify(pbp, null, 2));
      await sleep(options.throttleMs);
    } catch (error) {
      console.error(`Failed to fetch ${game.id}:`, error);
    }
  }

  console.log('Completed Sportradar download. Raw files saved to', outputRoot);
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
