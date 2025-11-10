#!/usr/bin/env tsx

import { mkdir, writeFile } from 'fs/promises';
import path from 'path';

const BASE_URL = 'https://github.com/nflverse/nflfastR-data/raw/master/data';

interface CliOptions {
  seasons: number[];
  outputDir: string;
}

function parseArgs(): CliOptions {
  const args = process.argv.slice(2);
  const seasons: number[] = [];
  let outputDir = path.resolve('data/nflfastR');

  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    if (arg === '--season' || arg === '-s') {
      seasons.push(Number(args[++i]));
    } else if (arg === '--out' || arg === '-o') {
      outputDir = path.resolve(args[++i]);
    }
  }

  if (!seasons.length) {
    throw new Error('Provide at least one --season (e.g. --season 2023 --season 2022)');
  }

  return { seasons, outputDir };
}

async function downloadSeason(season: number, outputDir: string) {
  const url = `${BASE_URL}/play_by_play_${season}.parquet`;
  const response = await fetch(url);
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Failed to download ${season}: ${response.statusText} ${body}`);
  }
  const buffer = await response.arrayBuffer();
  const outFile = path.join(outputDir, `play_by_play_${season}.parquet`);
  await writeFile(outFile, Buffer.from(buffer));
  console.log(`Saved ${outFile}`);
}

async function run() {
  const { seasons, outputDir } = parseArgs();
  await mkdir(outputDir, { recursive: true });
  for (const season of seasons) {
    console.log(`Downloading nflfastR play-by-play ${season}...`);
    await downloadSeason(season, outputDir);
  }
  console.log('Download complete.');
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
