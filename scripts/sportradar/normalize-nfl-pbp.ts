#!/usr/bin/env tsx

import { mkdir, readdir, readFile, writeFile } from 'fs/promises';
import path from 'path';
import { pipeline } from 'stream/promises';
import { Readable } from 'stream';
import { stringify } from 'csv-stringify';

interface PlayRecord {
  event_id: string;
  game_id: string;
  sequence: number;
  period: number;
  clock_seconds: number;
  home_score: number;
  away_score: number;
  description: string;
  play_type?: string;
  yards_gained?: number;
  possession?: 'home' | 'away';
}

interface SportradarGamePbp {
  id: string;
  status?: string;
  home?: { alias: string };
  away?: { alias: string };
  quarter?: {
    number: number;
    scoring?: Array<unknown>;
    sequence: number;
  }[];
  drives?: {
    id: string;
    team: { id: string };
    sequence?: number;
    plays?: Array<{
      id: string;
      sequence?: number;
      clock?: {
        minutes?: number;
        seconds?: number;
      };
      period?: { number?: number };
      description?: string;
      type?: string;
      yards?: number;
      gain?: number;
      home_points?: number;
      away_points?: number;
      team?: { id?: string };
    }>;
  }[];
}

interface NormalizeOptions {
  inputDir: string;
  outputDir: string;
}

function parseArgs(): NormalizeOptions {
  const args = process.argv.slice(2);
  const options: Partial<NormalizeOptions> = {};
  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    if (arg === '--input' || arg === '-i') {
      options.inputDir = args[++i];
    } else if (arg === '--output' || arg === '-o') {
      options.outputDir = args[++i];
    }
  }
  if (!options.inputDir) {
    throw new Error('Missing --input directory');
  }
  return {
    inputDir: options.inputDir,
    outputDir: options.outputDir ?? path.resolve('data/sportradar/processed'),
  };
}

function flattenGame(game: SportradarGamePbp): PlayRecord[] {
  const plays: PlayRecord[] = [];
  if (!game.drives) return plays;

  for (const drive of game.drives) {
    if (!drive.plays) continue;
    for (const play of drive.plays) {
      const clockSeconds = (play.clock?.minutes ?? 0) * 60 + (play.clock?.seconds ?? 0);
      const record: PlayRecord = {
        event_id: play.id,
        game_id: game.id,
        sequence: play.sequence ?? 0,
        period: play.period?.number ?? 0,
        clock_seconds: clockSeconds,
        home_score: play.home_points ?? 0,
        away_score: play.away_points ?? 0,
        description: play.description ?? '',
        play_type: play.type,
        yards_gained: play.yards ?? play.gain,
      };
      plays.push(record);
    }
  }

  plays.sort((a, b) => a.period - b.period || a.sequence - b.sequence);
  return plays;
}

async function normalizeGames(options: NormalizeOptions) {
  const files = await readdir(options.inputDir);
  const csvOut = path.resolve(options.outputDir, 'nfl_pbp_flat.csv');
  await mkdir(options.outputDir, { recursive: true });

  const stringifier = stringify({ header: true, columns: Object.keys(flattenGame({ id: 'template', drives: [] })[0] ?? {}) });
  const writePromise = pipeline(stringifier, async function* (source) {
    let buffer = '';
    for await (const chunk of source) {
      buffer += chunk.toString();
      if (buffer.length > 32_768) {
        await writeFile(csvOut, buffer, { flag: 'a' });
        buffer = '';
      }
    }
    if (buffer) {
      await writeFile(csvOut, buffer, { flag: 'a' });
    }
  });

  // prime file with header
  stringifier.write(Object.keys(flattenGame({ id: 'template', drives: [] })[0] ?? {}));

  for (const [index, file] of files.entries()) {
    if (!file.endsWith('.json')) continue;
    const fullPath = path.join(options.inputDir, file);
    const raw = await readFile(fullPath, 'utf-8');
    const parsed = JSON.parse(raw) as SportradarGamePbp;
    const rows = flattenGame(parsed);
    if (!rows.length) continue;
    console.log(`[${index + 1}/${files.length}] ${file} → ${rows.length} plays`);
    for (const row of rows) {
      stringifier.write(row);
    }
  }

  stringifier.end();
  await writePromise;
  console.log('Normalized CSV written to', csvOut);
}

normalizeGames(parseArgs()).catch((error) => {
  console.error(error);
  process.exit(1);
});
